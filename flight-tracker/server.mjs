import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createSearchLimiter, validateSearch } from './search.mjs';

const assets = new Map([
  ['/', ['./index.html', 'text/html']],
  ['/style.css', ['./style.css', 'text/css']],
  ['/app.js', ['./app.js', 'text/javascript']],
  ['/sample.json', ['../evidence/example-output.json', 'application/json']],
]);
const gateway = process.env.FLIGHT_TRACKER_GATEWAY === '1';
const allowedOrigin = process.env.FLIGHT_TRACKER_ORIGIN;
const webhookToken = process.env.N8N_WEBHOOK_TOKEN;
const volumePath = process.env.RAILWAY_VOLUME_MOUNT_PATH;
const webhook = process.env.N8N_WEBHOOK_URL ??
  'http://127.0.0.1:5678/webhook/flight-price-tracker';

if (gateway && (!allowedOrigin || !webhookToken || !volumePath || !process.env.N8N_WEBHOOK_URL)) {
  throw new Error('Set FLIGHT_TRACKER_ORIGIN, N8N_WEBHOOK_URL and N8N_WEBHOOK_TOKEN, and attach a Railway volume.');
}
if (gateway) {
  const origin = new URL(allowedOrigin);
  const upstream = new URL(webhook);
  if (origin.protocol !== 'https:' || origin.origin !== allowedOrigin ||
      !['http:', 'https:'].includes(upstream.protocol) ||
      (upstream.protocol === 'http:' && !upstream.hostname.endsWith('.railway.internal')) ||
      upstream.username || upstream.password || upstream.search || upstream.hash ||
      upstream.pathname !== '/webhook/flight-price-tracker') {
    throw new Error('Use a GitHub Pages HTTPS origin and an n8n production webhook on the Railway private network or HTTPS.');
  }
}

function limit(name, fallback) {
  const number = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(number) || number < 1) throw new Error(name + ' must be a positive integer.');
  return number;
}

const reserveSearch = await createSearchLimiter(
  gateway ? join(volumePath, 'flight-search-limits.json') : null,
  limit('SEARCH_LIMIT_PER_10_MINUTES', 5),
  limit('SEARCH_LIMIT_PER_DAY', 20),
);

function send(response, status, data, type = 'application/json') {
  response.writeHead(status, {
    'Content-Type': type + '; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(data);
}

function message(response, status, text) {
  send(response, status, JSON.stringify({ message: text }));
}

createServer({ requestTimeout: 20_000 }, async (request, response) => {
  const path = request.url?.split('?')[0];
  if (request.method === 'GET' && path === '/health') {
    send(response, 200, '{"status":"ok"}');
    return;
  }
  if (!gateway && request.method === 'GET') {
    if (path === '/config.json') {
      send(response, 200, '{"hosted":false}');
      return;
    }
    const asset = assets.get(path);
    if (asset) {
      try {
        send(response, 200, await readFile(new URL(asset[0], import.meta.url)), asset[1]);
      } catch {
        message(response, 500, 'Could not load the dashboard asset.');
      }
      return;
    }
  }
  if (path !== '/api/search') {
    message(response, 404, 'Page not found.');
    return;
  }
  if (gateway) {
    response.setHeader('Vary', 'Origin');
    if (request.headers.origin !== allowedOrigin) {
      message(response, 403, 'This origin is not allowed to use flight search.');
      return;
    }
    response.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    if (request.method === 'OPTIONS') {
      response.setHeader('Access-Control-Allow-Methods', 'POST');
      response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      response.writeHead(204).end();
      return;
    }
    response.setHeader('Access-Control-Expose-Headers', 'Retry-After');
  }
  if (request.method !== 'POST') {
    response.setHeader('Allow', gateway ? 'POST, OPTIONS' : 'POST');
    message(response, 405, 'Use POST to search for flights.');
    return;
  }
  if (request.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    message(response, 415, 'Send the flight request as JSON.');
    return;
  }

  let payload;
  try {
    let body = '';
    request.setEncoding('utf8');
    for await (const chunk of request.iterator({ destroyOnReturn: false })) {
      body += chunk;
      if (Buffer.byteLength(body) > 4096) {
        message(response, 413, 'Flight request is too large.');
        request.resume();
        return;
      }
    }
    payload = JSON.parse(body);
  } catch {
    if (!response.destroyed) message(response, 400, 'Flight request contains invalid JSON.');
    return;
  }

  let search;
  try {
    search = validateSearch(payload);
  } catch (error) {
    message(response, 400, error.message);
    return;
  }

  try {
    const retryAfter = await reserveSearch();
    if (retryAfter) {
      response.setHeader('Retry-After', retryAfter);
      message(response, 429, 'The public search limit has been reached. Try again later.');
      return;
    }
  } catch {
    console.error('Could not persist flight search rate limit state.');
    message(response, 503, 'Flight search is temporarily unavailable.');
    return;
  }

  try {
    const upstream = await fetch(webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(webhookToken ? { 'X-Flight-Tracker-Token': webhookToken } : {}),
      },
      body: JSON.stringify(search),
      signal: AbortSignal.timeout(120_000),
      redirect: 'error',
    });
    if (!upstream.ok) {
      console.error('n8n webhook returned status', upstream.status);
      message(response, 502, 'The flight workflow could not complete the search.');
      return;
    }
    send(response, 200, JSON.stringify(await upstream.json()));
  } catch (error) {
    const timedOut = error.name === 'TimeoutError';
    message(response, timedOut ? 504 : 502, timedOut
      ? 'The search timed out. Please try again later.'
      : 'Could not read a response from the flight workflow.');
  }
}).listen(Number(process.env.PORT ?? 8080), gateway ? '0.0.0.0' : '127.0.0.1', () => {
  console.log('Flight Tracker is listening on port ' + (process.env.PORT ?? 8080));
});
