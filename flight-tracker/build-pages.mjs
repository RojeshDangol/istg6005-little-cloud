import { copyFile, mkdir, writeFile } from 'node:fs/promises';

const apiUrl = process.env.FLIGHT_TRACKER_API_URL?.trim() ?? '';
if (apiUrl) {
  const url = new URL(apiUrl);
  if (url.protocol !== 'https:' || url.username || url.password || url.search ||
      url.hash || url.pathname !== '/api/search') {
    throw new Error('Set FLIGHT_TRACKER_API_URL to the HTTPS gateway URL ending in /api/search.');
  }
}

const output = new URL('../pages-artifact/', import.meta.url);
await mkdir(output, { recursive: true });
await Promise.all([
  ...['index.html', 'style.css', 'app.js'].map(name =>
    copyFile(new URL(name, import.meta.url), new URL(name, output))),
  copyFile(new URL('../evidence/example-output.json', import.meta.url), new URL('sample.json', output)),
  writeFile(new URL('config.json', output), JSON.stringify({ hosted: true, apiUrl })),
]);
