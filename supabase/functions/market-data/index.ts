const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS"
};

type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type Stock = {
  symbol: string;
  ySymbol: string;
  name: string;
  market: string;
  price: number;
  change: number;
  chart?: Candle[];
};

const knownStocks: Stock[] = [
  { symbol: "005930", ySymbol: "005930.KS", name: "삼성전자", market: "KOSPI", price: 80200, change: 1.4 },
  { symbol: "035420", ySymbol: "035420.KS", name: "NAVER", market: "KOSPI", price: 186500, change: -0.8 },
  { symbol: "035720", ySymbol: "035720.KS", name: "카카오", market: "KOSPI", price: 49300, change: 2.1 },
  { symbol: "000660", ySymbol: "000660.KS", name: "SK하이닉스", market: "KOSPI", price: 214000, change: 3.2 },
  { symbol: "005380", ySymbol: "005380.KS", name: "현대차", market: "KOSPI", price: 258000, change: -1.1 },
  { symbol: "068270", ySymbol: "068270.KS", name: "셀트리온", market: "KOSPI", price: 183400, change: 0.6 },
  { symbol: "042660", ySymbol: "042660.KS", name: "한화오션", market: "KOSPI", price: 38250, change: 1.8 },
  { symbol: "373220", ySymbol: "373220.KS", name: "LG에너지솔루션", market: "KOSPI", price: 389000, change: 0.9 },
  { symbol: "207940", ySymbol: "207940.KS", name: "삼성바이오로직스", market: "KOSPI", price: 832000, change: -0.3 },
  { symbol: "091990", ySymbol: "091990.KQ", name: "셀트리온헬스케어", market: "KOSDAQ", price: 0, change: 0 },
  { symbol: "247540", ySymbol: "247540.KQ", name: "에코프로비엠", market: "KOSDAQ", price: 0, change: 0 },
  { symbol: "086520", ySymbol: "086520.KQ", name: "에코프로", market: "KOSDAQ", price: 0, change: 0 },
  { symbol: "AAPL", ySymbol: "AAPL", name: "Apple", market: "NASDAQ", price: 245000, change: 1.1 },
  { symbol: "TSLA", ySymbol: "TSLA", name: "Tesla", market: "NASDAQ", price: 286000, change: -1.7 }
];

function normalize(value: string) {
  return value.replace(/\s/g, "").toLowerCase();
}

function marketFromYahooSymbol(ySymbol: string) {
  if (ySymbol.endsWith(".KS")) return "KOSPI";
  if (ySymbol.endsWith(".KQ")) return "KOSDAQ";
  return "US";
}

function cleanSymbol(ySymbol: string) {
  return ySymbol.replace(".KS", "").replace(".KQ", "");
}

function searchKnownStocks(query: string) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return knownStocks.slice(0, 12);

  return knownStocks.filter((stock) => {
    return (
      normalize(stock.name).includes(normalizedQuery) ||
      normalize(stock.symbol).includes(normalizedQuery) ||
      normalize(stock.ySymbol).includes(normalizedQuery) ||
      normalize(stock.market).includes(normalizedQuery)
    );
  });
}

async function fetchYahooChart(ySymbol: string, range = "1mo", interval = "1d"): Promise<Stock | null> {
  const url = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ySymbol)}`);
  url.searchParams.set("range", range);
  url.searchParams.set("interval", interval);

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json"
    }
  });

  if (!response.ok) return null;

  const payload = await response.json();
  const result = payload?.chart?.result?.[0];
  if (!result) return null;

  const meta = result.meta ?? {};
  const quote = result.indicators?.quote?.[0] ?? {};
  const timestamps: number[] = result.timestamp ?? [];
  const closes: Array<number | null> = quote.close ?? [];
  const opens: Array<number | null> = quote.open ?? [];
  const highs: Array<number | null> = quote.high ?? [];
  const lows: Array<number | null> = quote.low ?? [];
  const volumes: Array<number | null> = quote.volume ?? [];

  const chart: Candle[] = timestamps
    .map((timestamp, index) => ({
      time: new Date(timestamp * 1000).toISOString().slice(0, 10),
      open: Number(opens[index] ?? closes[index] ?? 0),
      high: Number(highs[index] ?? closes[index] ?? 0),
      low: Number(lows[index] ?? closes[index] ?? 0),
      close: Number(closes[index] ?? 0),
      volume: Number(volumes[index] ?? 0)
    }))
    .filter((candle) => candle.close > 0);

  const lastClose = chart.at(-1)?.close ?? Number(meta.regularMarketPrice ?? 0);
  const previousClose = Number(meta.chartPreviousClose ?? chart.at(-2)?.close ?? lastClose);
  const change = previousClose ? ((lastClose - previousClose) / previousClose) * 100 : 0;
  const known = knownStocks.find((stock) => stock.ySymbol === ySymbol || stock.symbol === cleanSymbol(ySymbol));

  return {
    symbol: cleanSymbol(ySymbol),
    ySymbol,
    name: known?.name || String(meta.shortName || meta.longName || cleanSymbol(ySymbol)),
    market: known?.market || marketFromYahooSymbol(ySymbol),
    price: lastClose,
    change,
    chart
  };
}

async function tryKoreanNumericSymbol(symbol: string) {
  const candidates = [`${symbol}.KS`, `${symbol}.KQ`];
  const results: Stock[] = [];

  for (const candidate of candidates) {
    const stock = await fetchYahooChart(candidate);
    if (stock?.price) results.push(stock);
  }

  return results;
}

async function searchYahoo(query: string) {
  const url = new URL("https://query1.finance.yahoo.com/v1/finance/search");
  url.searchParams.set("q", query);
  url.searchParams.set("quotesCount", "15");
  url.searchParams.set("newsCount", "0");

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json"
    }
  });

  if (!response.ok) return [];

  const payload = await response.json();
  const quotes: Array<Record<string, unknown>> = payload.quotes ?? [];
  const yahooSymbols = quotes
    .map((quote) => String(quote.symbol ?? ""))
    .filter((symbol) => symbol && (symbol.endsWith(".KS") || symbol.endsWith(".KQ") || /^[A-Z.]+$/.test(symbol)))
    .slice(0, 8);

  const results: Stock[] = [];
  for (const ySymbol of yahooSymbols) {
    const stock = await fetchYahooChart(ySymbol);
    if (stock?.price) results.push(stock);
  }

  return results;
}

function uniqueStocks(stocks: Stock[]) {
  const stockMap = new Map<string, Stock>();
  stocks.forEach((stock) => {
    const key = stock.ySymbol || stock.symbol;
    if (!stockMap.has(key)) stockMap.set(key, stock);
  });
  return Array.from(stockMap.values());
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("query") ?? "";
    const mode = url.searchParams.get("mode") ?? "search";
    const ySymbol = url.searchParams.get("ySymbol") ?? "";
    const symbol = url.searchParams.get("symbol") ?? query;
    const range = url.searchParams.get("range") ?? "1mo";
    const interval = url.searchParams.get("interval") ?? "1d";

    if (mode === "chart") {
      const target = ySymbol || knownStocks.find((stock) => stock.symbol === symbol)?.ySymbol || symbol;
      const chartStock = await fetchYahooChart(target, range, interval);
      return Response.json(
        {
          source: chartStock ? "yahoo" : "mock",
          stock: chartStock ?? searchKnownStocks(symbol)[0] ?? null
        },
        { headers: corsHeaders }
      );
    }

    const knownMatches = searchKnownStocks(query);
    const numericMatches = /^\d{6}$/.test(query) ? await tryKoreanNumericSymbol(query) : [];
    const yahooMatches = query ? await searchYahoo(query) : [];
    const stocks = uniqueStocks([...numericMatches, ...knownMatches, ...yahooMatches]).slice(0, 20);

    return Response.json(
      {
        source: yahooMatches.length || numericMatches.length ? "yahoo" : "mock",
        stocks
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stocks: searchKnownStocks("")
      },
      { status: 500, headers: corsHeaders }
    );
  }
});
