export class FlightSearchError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function providerJson(url, options, provider, fetcher) {
  try {
    const response = await fetcher(url, { ...options, redirect: 'error' });
    if (!response.ok) throw new Error('Unexpected HTTP status');
    return await response.json();
  } catch (error) {
    if (error.name === 'TimeoutError') {
      throw new FlightSearchError(504, provider + ' timed out. Please try again later.');
    }
    throw new FlightSearchError(502, provider + ' is temporarily unavailable.');
  }
}

export async function searchFlights(search, { serpApiKey, openAiKey, model }, fetcher = fetch) {
  const url = new URL('https://serpapi.com/search.json');
  url.search = new URLSearchParams({
    engine: 'google_flights',
    departure_id: search.origin,
    arrival_id: search.destination,
    outbound_date: search.outbound_date,
    return_date: search.return_date,
    type: '1',
    currency: 'USD',
    hl: 'en',
    adults: '1',
    api_key: serpApiKey,
  });
  const fares = await providerJson(url, { signal: AbortSignal.timeout(30_000) }, 'Flight search', fetcher);
  if (fares?.error || fares?.search_metadata?.status !== 'Success') {
    throw new FlightSearchError(502, 'Flight search is temporarily unavailable.');
  }

  const best = Array.isArray(fares.best_flights) ? fares.best_flights : [];
  const other = Array.isArray(fares.other_flights) ? fares.other_flights : [];
  const options = [...best, ...other]
    .filter(fare => Number.isFinite(fare?.price) && fare.price > 0)
    .sort((a, b) => a.price - b.price)
    .slice(0, 5)
    .map(fare => {
      const segments = Array.isArray(fare.flights) ? fare.flights : [];
      const airlines = segments.map(segment => segment?.airline)
        .filter(airline => typeof airline === 'string' && airline.length);
      const stops = segments.length - 1;
      return {
        price: fare.price,
        airlines: [...new Set(airlines)].join(', '),
        duration_minutes: Number.isFinite(fare.total_duration) ? fare.total_duration : null,
        layovers: stops > 0 ? stops + (stops === 1 ? ' outbound stop' : ' outbound stops')
          : stops === 0 ? 'Nonstop outbound' : '',
      };
    });
  if (!options.length) {
    throw new FlightSearchError(404, 'No priced flights were found for these dates.');
  }

  const ai = await providerJson('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + openAiKey, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(65_000),
    body: JSON.stringify({
      model,
      store: false,
      max_output_tokens: 1800,
      instructions: 'Choose one flight option using only the supplied data. Weigh the USD budget, fare, outbound duration and outbound stops. Explain your choice briefly and say if all the options exceed the budget. Prices are round-trip estimates and durations and stops describe the outbound leg. Do not invent travel details or predict future prices.',
      input: JSON.stringify({
        budget: search.budget,
        options: options.map((option, index) => ({ index, ...option })),
      }),
      text: {
        format: {
          type: 'json_schema',
          name: 'flight_recommendation',
          strict: true,
          schema: {
            type: 'object',
            properties: { option_index: { type: 'integer' }, recommendation: { type: 'string' } },
            required: ['option_index', 'recommendation'],
            additionalProperties: false,
          },
        },
      },
    }),
  }, 'AI recommendations', fetcher);

  try {
    if (ai.status !== 'completed') throw new Error('Incomplete response');
    const output = ai.output.filter(item => item.type === 'message')
      .flatMap(item => item.content)
      .find(content => content.type === 'output_text');
    const { option_index, recommendation } = JSON.parse(output.text);
    if (!Number.isInteger(option_index) || option_index < 0 || option_index >= options.length ||
        typeof recommendation !== 'string' || !recommendation.trim()) {
      throw new Error('Invalid recommendation');
    }
    return {
      cheapest_price: options[0].price,
      recommended_price: options[option_index].price,
      recommendation: recommendation.trim(),
      flights: options,
    };
  } catch {
    throw new FlightSearchError(502, 'AI recommendations could not be completed. Please try again later.');
  }
}
