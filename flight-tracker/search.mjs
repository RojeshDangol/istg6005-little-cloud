import { readFile, rename, writeFile } from 'node:fs/promises';

const day = 86_400_000;

function travelDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
    ? date.getTime() : NaN;
}

export function validateSearch(input, now = Date.now()) {
  const origin = typeof input?.origin === 'string' ? input.origin.trim().toUpperCase() : '';
  const destination = typeof input?.destination === 'string' ? input.destination.trim().toUpperCase() : '';
  if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination) || origin === destination) {
    throw new Error('Enter two different three-letter airport codes.');
  }

  const { outbound_date, return_date, budget } = input;
  const outbound = travelDate(outbound_date);
  const inbound = travelDate(return_date);
  const today = Math.floor(now / day) * day;
  if (!Number.isFinite(outbound) || !Number.isFinite(inbound) ||
      outbound < today || inbound <= outbound || inbound > today + 365 * day) {
    throw new Error('Choose future travel dates within 365 days, with the return after departure.');
  }

  if (typeof budget !== 'number' || !Number.isFinite(budget) || budget < 0.01 ||
      budget > 100_000 || Number(budget.toFixed(2)) !== budget) {
    throw new Error('Enter a USD budget from $0.01 to $100,000 with up to two decimal places.');
  }

  return { origin, destination, outbound_date, return_date, budget };
}

export async function createSearchLimiter(file, shortLimit, dailyLimit) {
  let timestamps = [];
  if (file) {
    try {
      timestamps = JSON.parse(await readFile(file, 'utf8'));
      if (!Array.isArray(timestamps) ||
          !timestamps.every(time => Number.isSafeInteger(time) && time >= 0)) {
        throw new Error('Invalid search rate limit state.');
      }
      timestamps.sort((a, b) => a - b);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }

  let pending = Promise.resolve();
  return () => {
    const reservation = pending.then(async () => {
      const now = Date.now();
      const recent = timestamps.filter(time => time > now - day);
      const shortWindow = 10 * 60_000;
      const short = recent.filter(time => time > now - shortWindow);
      const retryAt = Math.max(
        recent.length >= dailyLimit ? recent[recent.length - dailyLimit] + day : now,
        short.length >= shortLimit ? short[short.length - shortLimit] + shortWindow : now,
      );
      if (retryAt > now) return Math.ceil((retryAt - now) / 1000);

      const updated = [...recent, now];
      if (file) {
        await writeFile(file + '.next', JSON.stringify(updated), { mode: 0o600, flush: true });
        await rename(file + '.next', file);
      }
      timestamps = updated;
      return 0;
    });
    pending = reservation.catch(() => {});
    return reservation;
  };
}

export async function createPriceHistory(file) {
  let records = [];
  if (file) {
    try {
      records = JSON.parse(await readFile(file, 'utf8'));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  if (!Array.isArray(records) || !records.every(row =>
    /^[A-Z]{3}$/.test(row?.origin) && /^[A-Z]{3}$/.test(row?.destination) &&
    row.origin !== row.destination && travelDate(row.outbound_date) < travelDate(row.return_date) &&
    Number.isFinite(row.cheapest_price) && row.cheapest_price > 0 &&
    typeof row.createdAt === 'string' && Number.isFinite(Date.parse(row.createdAt)))) {
    throw new Error('Invalid flight price history.');
  }
  records.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

  let pending = Promise.resolve();
  return (search, analysis) => {
    const saved = pending.then(async () => {
      const { origin, destination, outbound_date, return_date, budget } = search;
      const itinerary = { origin, destination, outbound_date, return_date };
      const current = analysis.cheapest_price;
      const row = { ...itinerary, cheapest_price: current, createdAt: new Date().toISOString() };
      const prices = records.filter(record =>
        Object.keys(itinerary).every(field => record[field] === itinerary[field]))
        .map(record => record.cheapest_price);
      const previous = prices.at(-1) ?? null;
      prices.push(current);

      const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const change = previous === null ? null : current - previous;
      const updated = [...records, row];
      if (file) {
        await writeFile(file + '.next', JSON.stringify(updated), { mode: 0o600, flush: true });
        await rename(file + '.next', file);
      }
      records = updated;

      return {
        ...itinerary,
        budget,
        historical_records: prices.length,
        current_price: current,
        previous_price: previous,
        average_price: Number(average.toFixed(2)),
        lowest_price: prices.reduce((lowest, price) => Math.min(lowest, price), current),
        highest_price: prices.reduce((highest, price) => Math.max(highest, price), current),
        price_change: change,
        percentage_change: change === null ? null : Number((change / previous * 100).toFixed(2)),
        trend: change === null ? 'INSUFFICIENT DATA' : change < 0 ? 'FALLING' : change > 0 ? 'RISING' : 'STABLE',
        recommendation: previous === null ? 'COLLECT MORE DATA' : current > budget ? 'OVER BUDGET - MONITOR'
          : current <= average ? 'CONSIDER BUYING' : 'MONITOR PRICE',
        ai_analysis: analysis,
      };
    });
    pending = saved.catch(() => {});
    return saved;
  };
}
