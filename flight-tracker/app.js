const form = document.querySelector('#search');
const results = document.querySelector('#results');
const status = document.querySelector('#status');
const mode = document.querySelector('#mode');
const sample = document.querySelector('#sample');
const submit = form.querySelector('[type="submit"]');
const originField = form.elements.namedItem('origin');
const destinationField = form.elements.namedItem('destination');
const outboundField = form.elements.namedItem('outbound_date');
const returnField = form.elements.namedItem('return_date');
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
let config = {};
try {
  const configResponse = await fetch('./config.json');
  if (!configResponse.ok) throw new Error('Missing dashboard configuration.');
  config = await configResponse.json();
} catch {
  setStatus('Dashboard configuration is unavailable. You can still view sample results.', true);
}

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function updateRoute(origin, destination) {
  document.querySelector('#hero-origin').textContent = origin || '—';
  document.querySelector('#hero-destination').textContent = destination || '—';
}

function setStatus(message, error = false) {
  status.textContent = message;
  status.classList.toggle('error', error);
}

function formatMoney(value) {
  return value == null || !Number.isFinite(Number(value)) ? '—' : money.format(value);
}

function formatDate(value) {
  const date = new Date(value + 'T00:00:00Z');
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  }).format(date);
}

function render(data, isSample) {
  const result = Array.isArray(data) ? data[0] : data;
  if (typeof result?.current_price !== 'number') {
    throw new Error(result?.reason || result?.message || 'The flight search returned an incomplete analysis.');
  }

  let analysis = result.ai_analysis;
  if (typeof analysis === 'string') {
    try {
      analysis = JSON.parse(analysis);
    } catch {
      analysis = null;
    }
  }

  const summary = element('p', undefined, 'summary');
  summary.append(
    element('strong', result.origin + ' to ' + result.destination),
    ' · ' + formatDate(result.outbound_date) + ' – ' + formatDate(result.return_date),
  );

  const metrics = element('dl', undefined, 'metrics');
  const entries = [
    ['Cheapest fare', formatMoney(result.current_price)],
    ['Budget', formatMoney(result.budget)],
    ['Previous fare', formatMoney(result.previous_price)],
    ['Historical average', formatMoney(result.average_price)],
    ['Lowest recorded', formatMoney(result.lowest_price)],
    ['Highest recorded', formatMoney(result.highest_price)],
    ['Price trend', result.trend ?? '—'],
    ['Recorded searches', result.historical_records ?? '—'],
  ];
  if (result.price_change != null) {
    const percentage = result.percentage_change;
    const change = (result.price_change > 0 ? '+' : '') + formatMoney(result.price_change);
    entries.push(['Change since last search', percentage == null ? change : change + ' (' + percentage + '%)']);
  }
  if (analysis?.recommended_price != null) {
    entries.push(['Recommended fare', formatMoney(analysis.recommended_price)]);
  }
  const budgetDifference = result.budget == null ? NaN : Number(result.budget) - result.current_price;
  if (Number.isFinite(budgetDifference)) {
    const budgetLabel = budgetDifference < 0 ? 'Over budget' : budgetDifference > 0 ? 'Under budget' : 'Budget difference';
    entries.push([budgetLabel, formatMoney(Math.abs(budgetDifference))]);
  }
  for (const [label, value] of entries) {
    const metric = element('div', undefined, 'metric');
    metric.append(element('dt', label), element('dd', value));
    metrics.append(metric);
  }

  results.replaceChildren(summary, metrics);
  if (result.recommendation) {
    const guidance = element('p', undefined, 'summary');
    guidance.append(element('strong', 'Buying guidance'), ' · ' + result.recommendation);
    results.append(guidance);
  }
  if (analysis?.recommendation) {
    const advice = element('p', undefined, 'summary');
    advice.append(element('strong', 'AI recommendation'), ' · ' + analysis.recommendation);
    results.append(advice);
  }
  if (Array.isArray(analysis?.flights) && analysis.flights.length) {
    const options = element('section');
    const list = element('ul', undefined, 'options');
    for (const flight of analysis.flights) {
      const row = element('li');
      const details = [];
      if (Number.isFinite(flight.duration_minutes)) {
        details.push(Math.floor(flight.duration_minutes / 60) + 'h ' + (flight.duration_minutes % 60) + 'm');
      }
      if (flight.layovers) details.push(flight.layovers);
      row.append(element('strong', flight.airlines || 'Airline unavailable'), element('span', formatMoney(flight.price)));
      if (details.length) row.append(element('small', details.join(' · ')));
      list.append(row);
    }
    options.append(element('h3', 'Flight options'), list);
    results.append(options);
  }
  mode.textContent = isSample ? 'Sample results' : 'Live results';
  mode.hidden = false;
  results.hidden = false;
  setStatus(isSample ? 'Saved example from the workflow.' : 'Search complete.');
}

async function load(url, options, isSample) {
  submit.disabled = sample.disabled = true;
  results.hidden = mode.hidden = true;
  submit.textContent = isSample ? 'Analyze fares' : 'Analyzing fares…';
  setStatus(isSample ? 'Loading sample results…' : 'Checking fares and comparing price history…');
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      if (response.status === 429) {
        const seconds = Number(response.headers.get('Retry-After'));
        const wait = seconds > 0 ? ' Try again in about ' + Math.ceil(seconds / 60) + ' min.' : ' Try again later.';
        throw new Error('The public search limit has been reached.' + wait);
      }
      const error = await response.json().catch(() => null);
      throw new Error(error?.message || 'Unable to load the results.');
    }
    render(await response.json(), isSample);
  } catch (error) {
    const message = config.hosted && !isSample && error instanceof TypeError
      ? 'Could not reach the public search service. Please try again later.'
      : error.message;
    setStatus(message, true);
  } finally {
    submit.disabled = sample.disabled = false;
    submit.textContent = 'Analyze fares';
  }
}

form.addEventListener('input', () => {
  updateRoute(originField.value.toUpperCase(), destinationField.value.toUpperCase());
  destinationField.setCustomValidity('');
  returnField.setCustomValidity('');
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (submit.disabled) return;
  if (!Object.hasOwn(config, 'hosted') || (config.hosted && !config.apiUrl)) {
    setStatus('Live searches require a configured gateway. You can still view sample results.', true);
    return;
  }
  const payload = Object.fromEntries(new FormData(form));
  payload.origin = payload.origin.toUpperCase();
  payload.destination = payload.destination.toUpperCase();
  if (payload.origin === payload.destination) {
    destinationField.setCustomValidity('Choose a different destination airport.');
  }
  if (returnField.value <= outboundField.value) {
    returnField.setCustomValidity('Choose a return date after the departure date.');
  }
  if (!form.reportValidity()) return;

  payload.budget = Number(payload.budget);
  load(config.hosted ? config.apiUrl : './api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    redirect: 'error',
    body: JSON.stringify(payload),
  }, false);
});

sample.addEventListener('click', () => load('./sample.json', {}, true));
