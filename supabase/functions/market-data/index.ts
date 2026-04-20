const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS"
};

type Stock = {
  symbol: string;
  name: string;
  market: string;
  price: number;
  change: number;
};

const mockStocks: Stock[] = [
  { symbol: "005930", name: "삼성전자", market: "KOSPI", price: 80200, change: 1.4 },
  { symbol: "035420", name: "NAVER", market: "KOSPI", price: 186500, change: -0.8 },
  { symbol: "035720", name: "카카오", market: "KOSPI", price: 49300, change: 2.1 },
  { symbol: "000660", name: "SK하이닉스", market: "KOSPI", price: 214000, change: 3.2 },
  { symbol: "005380", name: "현대차", market: "KOSPI", price: 258000, change: -1.1 },
  { symbol: "068270", name: "셀트리온", market: "KOSPI", price: 183400, change: 0.6 },
  { symbol: "373220", name: "LG에너지솔루션", market: "KOSPI", price: 389000, change: 0.9 },
  { symbol: "207940", name: "삼성바이오로직스", market: "KOSPI", price: 832000, change: -0.3 },
  { symbol: "AAPL", name: "Apple", market: "NASDAQ", price: 245000, change: 1.1 },
  { symbol: "TSLA", name: "Tesla", market: "NASDAQ", price: 286000, change: -1.7 }
];

function normalize(value: string) {
  return value.replace(/\s/g, "").toLowerCase();
}

function searchMockStocks(query: string) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return mockStocks;

  return mockStocks.filter((stock) => {
    return (
      normalize(stock.name).includes(normalizedQuery) ||
      normalize(stock.symbol).includes(normalizedQuery) ||
      normalize(stock.market).includes(normalizedQuery)
    );
  });
}

async function fetchFromExternalProvider(query: string): Promise<Stock[] | null> {
  const providerUrl = Deno.env.get("MARKET_PROVIDER_URL");
  const providerKey = Deno.env.get("MARKET_PROVIDER_KEY");

  if (!providerUrl || !providerKey) {
    return null;
  }

  // Replace this adapter with the response shape of your chosen securities API.
  // The browser never sees MARKET_PROVIDER_KEY because this code runs in Supabase.
  const url = new URL(providerUrl);
  if (query) url.searchParams.set("query", query);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${providerKey}`,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`External provider failed: ${response.status}`);
  }

  const payload = await response.json();
  const rows = Array.isArray(payload.stocks) ? payload.stocks : [];

  return rows.map((row: Record<string, unknown>) => ({
    symbol: String(row.symbol ?? row.code ?? ""),
    name: String(row.name ?? row.stockName ?? ""),
    market: String(row.market ?? "UNKNOWN"),
    price: Number(row.price ?? row.currentPrice ?? 0),
    change: Number(row.change ?? row.changeRate ?? 0)
  })).filter((stock: Stock) => stock.symbol && stock.name && stock.price > 0);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("query") ?? "";

    const externalStocks = await fetchFromExternalProvider(query);
    const stocks = externalStocks?.length ? externalStocks : searchMockStocks(query);

    return Response.json(
      {
        source: externalStocks?.length ? "external" : "mock",
        stocks
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stocks: searchMockStocks("")
      },
      { status: 500, headers: corsHeaders }
    );
  }
});
