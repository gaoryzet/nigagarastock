const INITIAL_CASH = 10000000;
const STORAGE_KEY = "nigaGaraInvestmentKingStateV5";

const DEFAULT_STOCKS = [
  { symbol: "005930", ySymbol: "005930.KS", name: "삼성전자", market: "KOSPI", price: 80200, change: 1.4 },
  { symbol: "035420", ySymbol: "035420.KS", name: "NAVER", market: "KOSPI", price: 186500, change: -0.8 },
  { symbol: "035720", ySymbol: "035720.KS", name: "카카오", market: "KOSPI", price: 49300, change: 2.1 },
  { symbol: "000660", ySymbol: "000660.KS", name: "SK하이닉스", market: "KOSPI", price: 214000, change: 3.2 },
  { symbol: "005380", ySymbol: "005380.KS", name: "현대차", market: "KOSPI", price: 258000, change: -1.1 },
  { symbol: "068270", ySymbol: "068270.KS", name: "셀트리온", market: "KOSPI", price: 183400, change: 0.6 },
  { symbol: "042660", ySymbol: "042660.KS", name: "한화오션", market: "KOSPI", price: 38250, change: 1.8 },
  { symbol: "373220", ySymbol: "373220.KS", name: "LG에너지솔루션", market: "KOSPI", price: 389000, change: 0.9 },
  { symbol: "207940", ySymbol: "207940.KS", name: "삼성바이오로직스", market: "KOSPI", price: 832000, change: -0.3 },
  { symbol: "247540", ySymbol: "247540.KQ", name: "에코프로비엠", market: "KOSDAQ", price: 0, change: 0 },
  { symbol: "086520", ySymbol: "086520.KQ", name: "에코프로", market: "KOSDAQ", price: 0, change: 0 },
  { symbol: "AAPL", ySymbol: "AAPL", name: "Apple", market: "NASDAQ", price: 245000, change: 1.1 },
  { symbol: "TSLA", ySymbol: "TSLA", name: "Tesla", market: "NASDAQ", price: 286000, change: -1.7 }
];

let stocks = [...DEFAULT_STOCKS];
let krxMasterStocks = [];
let selectedChart = [];
let chartSource = "sample";
let selectedHoldingSymbol = "";

const CHART_RANGES = {
  "1d": { label: "1일", range: "1d", interval: "5m" },
  "1w": { label: "1주", range: "5d", interval: "30m" },
  "1mo": { label: "1개월", range: "1mo", interval: "1d" },
  "3mo": { label: "3개월", range: "3mo", interval: "1d" },
  "1y": { label: "1년", range: "1y", interval: "1d" }
};

function createEndDate(days = 14) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function createInviteCode() {
  return `TICKET-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function createInitialState() {
  const ticket = createInviteCode();
  return {
    league: {
      name: "새싹 투자왕 리그",
      ticket,
      initialCash: INITIAL_CASH,
      endDate: createEndDate(),
      status: "ACTIVE"
    },
    activeParticipantId: "",
    selectedSymbol: "005930",
    searchQuery: "",
    chartRange: "1mo",
    claimedTickets: [],
    participants: [],
    closedLeagues: []
  };
}

let state = loadState();

const els = {
  leagueName: document.querySelector("#leagueName"),
  leagueStatus: document.querySelector("#leagueStatus"),
  initialCash: document.querySelector("#initialCash"),
  daysLeft: document.querySelector("#daysLeft"),
  myRank: document.querySelector("#myRank"),
  leagueForm: document.querySelector("#leagueForm"),
  leagueInput: document.querySelector("#leagueInput"),
  endDateInput: document.querySelector("#endDateInput"),
  activeLeagueLabel: document.querySelector("#activeLeagueLabel"),
  activeLeagueMeta: document.querySelector("#activeLeagueMeta"),
  closedLeagueCount: document.querySelector("#closedLeagueCount"),
  closedLeagueList: document.querySelector("#closedLeagueList"),
  newLeagueBtn: document.querySelector("#newLeagueBtn"),
  deleteLeagueBtn: document.querySelector("#deleteLeagueBtn"),
  inviteCode: document.querySelector("#inviteCode"),
  inviteLink: document.querySelector("#inviteLink"),
  joinForm: document.querySelector("#joinForm"),
  nicknameInput: document.querySelector("#nicknameInput"),
  participants: document.querySelector("#participants"),
  activeUserSelect: document.querySelector("#activeUserSelect"),
  cashBalance: document.querySelector("#cashBalance"),
  totalAsset: document.querySelector("#totalAsset"),
  stockSearchInput: document.querySelector("#stockSearchInput"),
  selectedStockPanel: document.querySelector("#selectedStockPanel"),
  chartTabs: document.querySelector(".chart-tabs"),
  chartTitle: document.querySelector("#chartTitle"),
  chartMeta: document.querySelector("#chartMeta"),
  priceChart: document.querySelector("#priceChart"),
  chartStatus: document.querySelector("#chartStatus"),
  stockList: document.querySelector("#stockList"),
  buyForm: document.querySelector("#buyForm"),
  buyAmountInput: document.querySelector("#buyAmountInput"),
  sellForm: document.querySelector("#sellForm"),
  sellPanelTitle: document.querySelector("#sellPanelTitle"),
  sellPanelMeta: document.querySelector("#sellPanelMeta"),
  sellAmountInput: document.querySelector("#sellAmountInput"),
  sellSubmitBtn: document.querySelector("#sellSubmitBtn"),
  sellFullBtn: document.querySelector("#sellFullBtn"),
  executionPanel: document.querySelector("#executionPanel"),
  holdingsList: document.querySelector("#holdingsList"),
  rankingList: document.querySelector("#rankingList"),
  historyList: document.querySelector("#historyList"),
  closeLeagueBtn: document.querySelector("#closeLeagueBtn"),
  toast: document.querySelector("#toast")
};

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return normalizeState(stored ? JSON.parse(stored) : createInitialState());
  } catch {
    return createInitialState();
  }
}

function normalizeState(nextState) {
  const base = createInitialState();
  const merged = { ...base, ...nextState };
  merged.league = { ...base.league, ...(nextState.league || {}) };
  merged.participants = Array.isArray(nextState.participants) ? nextState.participants : [];
  if (!merged.league.ticket || (merged.league.ticket === "TICKET-1000" && !merged.participants.length)) {
    merged.league.ticket = merged.league.inviteCode && merged.league.inviteCode !== "TICKET-1000"
      ? merged.league.inviteCode
      : createInviteCode();
  }
  merged.closedLeagues = Array.isArray(nextState.closedLeagues) ? nextState.closedLeagues : [];
  merged.claimedTickets = Array.isArray(nextState.claimedTickets) ? nextState.claimedTickets : [];
  if (!merged.claimedTickets.length && merged.participants.length) {
    merged.claimedTickets = merged.participants
      .map((participant) => `${participant.ticket || merged.league.ticket}:${normalize(participant.nickname || "")}`)
      .filter((claimKey) => !claimKey.endsWith(":"));
  }
  if (!merged.participants.some((participant) => participant.id === merged.activeParticipantId)) {
    merged.activeParticipantId = merged.participants[0]?.id || "";
  }
  if (!CHART_RANGES[merged.chartRange]) {
    merged.chartRange = "1mo";
  }
  return merged;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatWon(value) {
  return `${Math.round(Number(value) || 0).toLocaleString("ko-KR")}원`;
}

function formatCompactWon(value) {
  const amount = Math.round(Number(value) || 0);
  return amount % 10000 === 0 ? `${(amount / 10000).toLocaleString("ko-KR")}만원` : formatWon(amount);
}

function formatRate(value) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${Number(value || 0).toFixed(2)}%`;
}

function getInitialCash() {
  return Number(state.league.initialCash) || INITIAL_CASH;
}

function normalize(value) {
  return String(value).replace(/\s/g, "").toLowerCase();
}

function stockKey(stock) {
  return stock.ySymbol || `${stock.symbol}.${stock.market}`;
}

function mergeStocks(primaryStocks, fallbackStocks) {
  const stockMap = new Map();
  fallbackStocks.forEach((stock) => stockMap.set(stockKey(stock), stock));
  primaryStocks.forEach((stock) => stockMap.set(stockKey(stock), stock));
  return Array.from(stockMap.values());
}

async function loadKrxMaster() {
  try {
    const response = await fetch("./krx-stocks.json", { cache: "no-store" });
    if (!response.ok) return;
    const rows = await response.json();
    if (!Array.isArray(rows)) return;
    krxMasterStocks = rows
      .map((stock) => ({
        symbol: String(stock.symbol || "").padStart(6, "0"),
        ySymbol: String(stock.ySymbol || stock.symbol || ""),
        name: String(stock.name || ""),
        market: String(stock.market || "KRX"),
        price: Number(stock.price || 0),
        change: Number(stock.change || 0)
      }))
      .filter((stock) => stock.symbol && stock.name);
    stocks = mergeStocks(stocks, krxMasterStocks);
  } catch (error) {
    console.warn(error);
  }
}

function getStock(symbol) {
  return stocks.find((stock) => stock.symbol === symbol) || DEFAULT_STOCKS.find((stock) => stock.symbol === symbol);
}

function updateStock(nextStock) {
  if (!nextStock?.symbol) return;
  const normalizedStock = {
    symbol: String(nextStock.symbol),
    ySymbol: String(nextStock.ySymbol || nextStock.symbol),
    name: String(nextStock.name || nextStock.symbol),
    market: String(nextStock.market || "UNKNOWN"),
    price: Number(nextStock.price || 0),
    change: Number(nextStock.change || 0)
  };
  stocks = mergeStocks([normalizedStock], stocks);
}

function getFilteredStocks() {
  const query = normalize(state.searchQuery || "");
  const searchableStocks = mergeStocks(stocks, mergeStocks(krxMasterStocks, DEFAULT_STOCKS));
  if (!query) return searchableStocks;

  return searchableStocks.filter((stock) => {
    return (
      normalize(stock.name).includes(query) ||
      normalize(stock.symbol).includes(query) ||
      normalize(stock.ySymbol || "").includes(query) ||
      normalize(stock.market).includes(query)
    );
  });
}

function hasMarketApi() {
  return Boolean(window.NGIK_CONFIG?.MARKET_DATA_FUNCTION_URL);
}

async function callMarketApi(params = {}) {
  if (!hasMarketApi()) return null;
  const url = new URL(window.NGIK_CONFIG.MARKET_DATA_FUNCTION_URL);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`Market API error: ${response.status}`);
  return response.json();
}

async function refreshStocks(query = "") {
  try {
    const payload = await callMarketApi({ query });
    if (!Array.isArray(payload?.stocks) || !payload.stocks.length) return;
    stocks = mergeStocks(payload.stocks.map((stock) => ({
      symbol: String(stock.symbol),
      ySymbol: String(stock.ySymbol || stock.symbol),
      name: String(stock.name),
      market: String(stock.market || "UNKNOWN"),
      price: Number(stock.price || 0),
      change: Number(stock.change || 0)
    })), mergeStocks(krxMasterStocks, DEFAULT_STOCKS));

    if (!getStock(state.selectedSymbol)) {
      state.selectedSymbol = stocks[0].symbol;
    }
  } catch (error) {
    console.warn(error);
    showToast("시세 API 연결 실패. 샘플 가격으로 계속 진행합니다.");
  }
}

function createSampleChart(stock) {
  const base = Number(stock?.price || 10000);
  const range = CHART_RANGES[state.chartRange] || CHART_RANGES["1mo"];
  const length = state.chartRange === "1d" ? 36 : state.chartRange === "1w" ? 30 : 24;
  return Array.from({ length }, (_, index) => {
    const wave = Math.sin(index / 3) * 0.025;
    const trend = (index - length / 2) * 0.002;
    const close = base * (1 + wave + trend);
    return {
      time: `${range.label}-${length - 1 - index}`,
      close,
      open: close * 0.995,
      high: close * 1.012,
      low: close * 0.988,
      volume: 0
    };
  });
}

async function loadSelectedChart() {
  const stock = getStock(state.selectedSymbol);
  if (!stock) return;

  selectedChart = createSampleChart(stock);
  chartSource = "sample";
  const rangeConfig = CHART_RANGES[state.chartRange] || CHART_RANGES["1mo"];

  try {
    const payload = await callMarketApi({
      mode: "chart",
      symbol: stock.symbol,
      ySymbol: stock.ySymbol,
      range: rangeConfig.range,
      interval: rangeConfig.interval
    });
    if (payload?.stock) {
      updateStock(payload.stock);
      if (Array.isArray(payload.stock.chart) && payload.stock.chart.length) {
        selectedChart = payload.stock.chart;
        chartSource = payload.source || "yahoo";
      }
    }
  } catch (error) {
    console.warn(error);
  }

  renderSelectedStock();
  renderChart();
  renderWallet();
  renderSellPanel();
  renderExecutionPanel();
  renderHoldings();
  renderRankings();
}

function calculateParticipant(participant) {
  const valuation = participant.holdings.reduce((sum, holding) => {
    const stock = getStock(holding.symbol);
    return stock ? sum + holding.quantity * stock.price : sum;
  }, 0);
  const totalAsset = participant.cash + valuation;
  const initialCash = getInitialCash();
  const profit = totalAsset - initialCash;
  const returnRate = (profit / initialCash) * 100;
  return { valuation, totalAsset, profit, returnRate };
}

function getRankings() {
  return state.participants
    .map((participant) => ({ ...participant, metrics: calculateParticipant(participant) }))
    .sort((a, b) => {
      if (b.metrics.totalAsset !== a.metrics.totalAsset) return b.metrics.totalAsset - a.metrics.totalAsset;
      if (b.metrics.returnRate !== a.metrics.returnRate) return b.metrics.returnRate - a.metrics.returnRate;
      return a.nickname.localeCompare(b.nickname, "ko-KR");
    });
}

function getActiveParticipant() {
  return state.participants.find((item) => item.id === state.activeParticipantId) || state.participants[0] || null;
}

function getSelectedHolding() {
  const active = getActiveParticipant();
  if (!active || !selectedHoldingSymbol) return null;
  return active.holdings.find((holding) => holding.symbol === selectedHoldingSymbol) || null;
}

function isClosed() {
  return state.league.status === "CLOSED" || isLeagueExpired();
}

function isLeagueExpired() {
  const end = new Date(`${state.league.endDate}T23:59:59`);
  return Number.isFinite(end.getTime()) && Date.now() > end.getTime();
}

function isPastEndDate(value) {
  if (!value) return false;
  const end = new Date(`${value}T23:59:59`);
  return Number.isFinite(end.getTime()) && Date.now() > end.getTime();
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.setTimeout(() => els.toast.classList.remove("show"), 1900);
}

function renderHeader() {
  const rankings = getRankings();
  const active = getActiveParticipant();
  const activeRank = active ? rankings.findIndex((item) => item.id === active.id) + 1 : 0;
  const today = new Date();
  const end = new Date(`${state.league.endDate}T23:59:59`);
  const daysLeft = Math.max(0, Math.ceil((end - today) / 86400000));

  els.leagueName.textContent = state.league.name;
  els.leagueInput.value = state.league.name;
  els.endDateInput.value = state.league.endDate;
  els.inviteCode.textContent = state.league.ticket;
  const inviteUrl = `${window.location.href.split("?")[0]}?ticket=${encodeURIComponent(state.league.ticket)}`;
  els.inviteLink.href = inviteUrl;
  els.inviteLink.textContent = inviteUrl;
  els.initialCash.textContent = formatCompactWon(getInitialCash());
  els.daysLeft.textContent = isClosed() ? "종료" : `${daysLeft}일`;
  els.myRank.textContent = activeRank ? `${activeRank}위` : "참여 전";
  els.leagueStatus.textContent = isClosed() ? "종료됨" : "진행 중";
  els.leagueStatus.classList.toggle("closed", isClosed());
}

function renderLeagueManagement() {
  els.activeLeagueLabel.textContent = state.league.name;
  els.activeLeagueMeta.textContent = isClosed()
    ? "이 리그는 종료되었습니다. 리그 관리에서 새 리그를 시작하세요."
    : `${state.participants.length}명 참여 중 · 종료일 ${state.league.endDate}`;
  els.closedLeagueCount.textContent = `${state.closedLeagues.length}개`;
  els.closedLeagueList.textContent = state.closedLeagues.length
    ? state.closedLeagues.map((league) => league.name).slice(-3).join(", ")
    : "아직 종료된 리그가 없습니다.";
  els.closeLeagueBtn.disabled = isClosed();
}

function renderParticipants() {
  if (!state.participants.length) {
    els.participants.innerHTML = `<p class="empty">아직 참여자가 없습니다. 닉네임을 등록하면 1,000만원이 지급됩니다.</p>`;
    return;
  }

  els.participants.innerHTML = state.participants
    .map((participant) => {
      const metrics = calculateParticipant(participant);
      const className = metrics.returnRate >= 0 ? "gain" : "loss";
      return `
        <div class="person">
          <div>
            <strong>${participant.nickname}</strong>
            <p class="muted">${formatWon(metrics.totalAsset)}</p>
          </div>
          <span class="${className}">${formatRate(metrics.returnRate)}</span>
        </div>
      `;
    })
    .join("");
}

function renderActiveSelect() {
  if (!state.participants.length) {
    els.activeUserSelect.innerHTML = `<option value="">참여자를 먼저 등록</option>`;
    return;
  }

  els.activeUserSelect.innerHTML = state.participants
    .map((participant) => {
      const selected = participant.id === state.activeParticipantId ? "selected" : "";
      return `<option value="${participant.id}" ${selected}>${participant.nickname}</option>`;
    })
    .join("");
}

function renderSelectedStock() {
  const stock = getStock(state.selectedSymbol);
  if (!stock) {
    els.selectedStockPanel.innerHTML = `<p>종목을 선택해주세요.</p>`;
    return;
  }
  const className = stock.change >= 0 ? "gain" : "loss";
  els.selectedStockPanel.innerHTML = `
    <div>
      <span>선택 종목</span>
      <strong>${stock.name}</strong>
      <p>${stock.symbol} · ${stock.market} · ${stock.ySymbol || stock.symbol}</p>
    </div>
    <div>
      <strong>${formatWon(stock.price)}</strong>
      <p class="${className}">${formatRate(stock.change)}</p>
    </div>
  `;
}

function renderChart() {
  const stock = getStock(state.selectedSymbol);
  const rangeConfig = CHART_RANGES[state.chartRange] || CHART_RANGES["1mo"];
  els.chartTitle.textContent = stock ? `${stock.name} ${rangeConfig.label}` : "종목을 선택하세요";
  els.chartMeta.textContent = stock ? `${formatWon(stock.price)} · ${formatRate(stock.change)}` : "현재가 검색 후 표시됩니다.";
  document.querySelectorAll(".chart-tabs button").forEach((button) => {
    button.classList.toggle("active", button.dataset.range === state.chartRange);
  });

  const closes = selectedChart.map((item) => Number(item.close)).filter((value) => value > 0);
  if (closes.length < 2) {
    els.priceChart.innerHTML = `<div class="chart-empty">차트 데이터가 아직 없습니다.</div>`;
    els.chartStatus.textContent = "종목을 선택하면 1개월 차트를 불러옵니다.";
    return;
  }

  const width = 320;
  const height = 150;
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const spread = max - min || 1;
  const points = closes.map((close, index) => {
    const x = (index / (closes.length - 1)) * width;
    const y = height - ((close - min) / spread) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const isUp = closes.at(-1) >= closes[0];
  const stroke = isUp ? "#10a85f" : "#e64b61";

  els.priceChart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${stock?.name || "종목"} 1개월 가격 차트">
      <polyline points="${points.join(" ")}" fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></polyline>
      <line x1="0" y1="${height - 1}" x2="${width}" y2="${height - 1}" stroke="#dce4ea" stroke-width="1"></line>
    </svg>
  `;
  els.chartStatus.textContent = chartSource === "yahoo"
    ? `Yahoo Finance ${rangeConfig.label} 기준입니다.`
    : "샘플 차트입니다. Supabase 함수 배포 후 Yahoo 데이터로 바뀝니다.";
}

function renderStocks() {
  const filteredStocks = getFilteredStocks();
  els.stockSearchInput.value = state.searchQuery;

  if (!filteredStocks.length) {
    els.stockList.innerHTML = `<p class="empty">검색 결과가 없습니다. 종목명이나 코드를 다시 입력해보세요.</p>`;
    renderSelectedStock();
    return;
  }

  els.stockList.innerHTML = filteredStocks
    .map((stock) => {
      const selected = stock.symbol === state.selectedSymbol ? "selected" : "";
      const className = stock.change >= 0 ? "gain" : "loss";
      return `
        <article class="stock-card ${selected}" data-symbol="${stock.symbol}">
          <div>
            <strong>${stock.name}</strong>
            <p class="muted">${stock.symbol} · ${stock.market}</p>
          </div>
          <div>
            <div class="price">${formatWon(stock.price)}</div>
            <div class="${className}">${formatRate(stock.change)}</div>
          </div>
        </article>
      `;
    })
    .join("");
  renderSelectedStock();
}

function renderWallet() {
  const active = getActiveParticipant();
  if (!active) {
    els.cashBalance.textContent = "참여 전";
    els.totalAsset.textContent = "참여 전";
    return;
  }
  const metrics = calculateParticipant(active);
  els.cashBalance.textContent = formatWon(active.cash);
  els.totalAsset.textContent = formatWon(metrics.totalAsset);
}

function renderSellPanel() {
  const active = getActiveParticipant();
  const holding = getSelectedHolding();
  const stock = holding ? getStock(holding.symbol) : null;

  if (!active) {
    els.sellPanelTitle.textContent = "참여자를 먼저 등록하세요";
    els.sellPanelMeta.textContent = "리그 참여 후 보유 종목을 선택하면 매도할 수 있습니다.";
    els.sellAmountInput.value = "";
    els.sellAmountInput.disabled = true;
    els.sellSubmitBtn.disabled = true;
    els.sellFullBtn.disabled = true;
    return;
  }

  if (!holding || !stock) {
    selectedHoldingSymbol = "";
    els.sellPanelTitle.textContent = "보유 종목을 선택하세요";
    els.sellPanelMeta.textContent = "보유 종목을 누르면 일부 매도와 전량 매도를 할 수 있습니다.";
    els.sellAmountInput.value = "";
    els.sellAmountInput.disabled = true;
    els.sellSubmitBtn.disabled = true;
    els.sellFullBtn.disabled = true;
    return;
  }

  const valuation = holding.quantity * stock.price;
  const invested = holding.quantity * holding.buyPrice;
  const profitRate = invested ? ((valuation - invested) / invested) * 100 : 0;

  els.sellPanelTitle.textContent = stock.name;
  els.sellPanelMeta.textContent = `${holding.quantity.toFixed(4)}주 보유 · 평가 ${formatWon(valuation)} · ${formatRate(profitRate)}`;
  els.sellAmountInput.disabled = false;
  els.sellSubmitBtn.disabled = isClosed();
  els.sellFullBtn.disabled = isClosed();
}

function renderExecutionPanel() {
  const active = getActiveParticipant();
  const latest = active?.history?.at(-1);

  if (!active || !latest) {
    els.executionPanel.innerHTML = `
      <span>마지막 체결</span>
      <strong>아직 체결된 주문이 없습니다.</strong>
      <p>매수나 매도 후 체결 수량, 체결가, 체결금액이 표시됩니다.</p>
    `;
    return;
  }

  const sideClass = latest.type === "매수" ? "buy" : "sell";
  els.executionPanel.innerHTML = `
    <span>마지막 체결</span>
    <strong class="${sideClass}">${latest.type} · ${latest.stockName}</strong>
    <p>${latest.quantity.toFixed(4)}주 · 체결가 ${formatWon(latest.executionPrice)} · 체결금액 ${formatWon(latest.amount)}</p>
    ${typeof latest.realizedProfit === "number" ? `<p class="${latest.realizedProfit >= 0 ? "gain" : "loss"}">실현손익 ${formatWon(latest.realizedProfit)} · ${formatRate(latest.realizedRate)}</p>` : ""}
  `;
}

function renderHoldings() {
  const active = getActiveParticipant();
  if (!active) {
    els.holdingsList.innerHTML = `<p class="empty">리그에서 사용할 닉네임을 먼저 등록해주세요.</p>`;
    return;
  }
  if (!active.holdings.length) {
    selectedHoldingSymbol = "";
    els.holdingsList.innerHTML = `<p class="empty">아직 보유 종목이 없습니다.</p>`;
    return;
  }

  if (!active.holdings.some((holding) => holding.symbol === selectedHoldingSymbol)) {
    selectedHoldingSymbol = "";
  }

  els.holdingsList.innerHTML = active.holdings
    .map((holding) => {
      const stock = getStock(holding.symbol);
      const valuation = holding.quantity * stock.price;
      const invested = holding.quantity * holding.buyPrice;
      const profitRate = ((valuation - invested) / invested) * 100;
      const className = profitRate >= 0 ? "gain" : "loss";
      const selectedClass = holding.symbol === selectedHoldingSymbol ? " selected" : "";
      return `
        <button class="holding-row${selectedClass}" type="button" data-symbol="${holding.symbol}">
          <div>
            <strong>${stock.name}</strong>
            <p class="muted">${holding.quantity.toFixed(4)}주 · ${formatWon(valuation)}</p>
          </div>
          <div class="holding-actions">
            <span class="${className}">${formatRate(profitRate)}</span>
            <span class="sell-hint">매도 선택</span>
          </div>
        </button>
      `;
    })
    .join("");
}

function renderRankings() {
  const rankings = getRankings();
  if (!rankings.length) {
    els.rankingList.innerHTML = `<p class="empty">참여자가 등록되면 랭킹이 표시됩니다.</p>`;
    return;
  }

  els.rankingList.innerHTML = rankings
    .map((participant, index) => {
      const className = participant.metrics.returnRate >= 0 ? "gain" : "loss";
      return `
        <article class="rank-card">
          <div class="rank-badge">${index + 1}</div>
          <div>
            <strong>${participant.nickname}</strong>
            <p class="muted">현금 ${formatWon(participant.cash)}</p>
          </div>
          <div>
            <div class="price">${formatWon(participant.metrics.totalAsset)}</div>
            <div class="${className}">${formatRate(participant.metrics.returnRate)}</div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderHistory() {
  const active = getActiveParticipant();
  if (!active) {
    els.historyList.innerHTML = `<p class="empty">리그 참여 후 거래 기록이 표시됩니다.</p>`;
    return;
  }
  if (!active.history.length) {
    els.historyList.innerHTML = `<p class="empty">거래 기록이 없습니다.</p>`;
    return;
  }

  els.historyList.innerHTML = active.history
    .slice()
    .reverse()
    .map((item) => `
      <article class="history-card">
        <p>${item.type} · ${item.stockName}</p>
        <span>${item.quantity.toFixed(4)}주 · 체결가 ${formatWon(item.executionPrice)} · ${formatWon(item.amount)} · ${item.createdAt}</span>
        ${typeof item.realizedProfit === "number" ? `<strong class="${item.realizedProfit >= 0 ? "gain" : "loss"}">실현손익 ${formatWon(item.realizedProfit)} · ${formatRate(item.realizedRate)}</strong>` : ""}
      </article>
    `)
    .join("");
}

function render() {
  renderHeader();
  renderLeagueManagement();
  renderParticipants();
  renderActiveSelect();
  renderStocks();
  renderSelectedStock();
  renderChart();
  renderWallet();
  renderSellPanel();
  renderExecutionPanel();
  renderHoldings();
  renderRankings();
  renderHistory();
  saveState();
}

function addHistory(participant, type, stock, amount, quantity, extra = {}) {
  participant.history.push({
    type,
    stockName: stock.name,
    amount,
    quantity,
    executionPrice: extra.executionPrice ?? stock.price,
    ...extra,
    createdAt: new Date().toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })
  });
}

function startNewLeague() {
  const hasLeagueData = state.participants.length || state.closedLeagues.length || state.league.status === "CLOSED";
  if (hasLeagueData) {
    const confirmed = window.confirm(
      "새 리그를 시작하면 현재 리그의 참여자, 보유 종목, 거래 기록이 초기화됩니다. 계속할까요?"
    );
    if (!confirmed) return;
  }

  if (state.participants.length || isClosed()) {
    state.closedLeagues.push({
      name: state.league.name,
      status: state.league.status,
      endedAt: new Date().toLocaleDateString("ko-KR"),
      participantCount: state.participants.length
    });
  }

  state.league = {
    name: els.leagueInput.value.trim() || "새싹 투자왕 리그",
    ticket: createInviteCode(),
    initialCash: INITIAL_CASH,
    endDate: isPastEndDate(els.endDateInput.value) ? createEndDate() : (els.endDateInput.value || createEndDate()),
    status: "ACTIVE"
  };
  state.participants = [];
  state.activeParticipantId = "";
  state.searchQuery = "";
  showToast("새 리그가 시작되었습니다. 참여자를 등록해주세요.");
  render();
}

function deleteCurrentLeague() {
  const confirmed = window.confirm(
    "현재 리그를 삭제하면 참여자, 보유 종목, 거래 기록, 링크 티켓 정보가 모두 사라집니다. 삭제할까요?"
  );
  if (!confirmed) return;

  state.league = {
    name: "새싹 투자왕 리그",
    ticket: createInviteCode(),
    initialCash: INITIAL_CASH,
    endDate: createEndDate(),
    status: "ACTIVE"
  };
  state.participants = [];
  state.activeParticipantId = "";
  state.claimedTickets = [];
  state.searchQuery = "";
  state.selectedSymbol = "005930";
  showToast("리그를 삭제하고 새 리그 준비 상태로 되돌렸습니다.");
  render();
}

async function buySelectedStock() {
  if (isClosed()) {
    showToast("종료된 리그에서는 거래할 수 없습니다.");
    return;
  }

  const active = getActiveParticipant();
  if (!active) {
    showToast("먼저 리그 참여 닉네임을 등록해주세요.");
    return;
  }

  await loadSelectedChart();
  const stock = getStock(state.selectedSymbol);
  const amount = Number(els.buyAmountInput.value.replaceAll(",", ""));

  if (!amount || amount < 10000) {
    showToast("매수 금액은 1만원 이상 입력해주세요.");
    return;
  }

  if (amount > active.cash) {
    showToast("보유 현금보다 많이 살 수 없습니다.");
    return;
  }

  const quantity = amount / stock.price;
  const holding = active.holdings.find((item) => item.symbol === stock.symbol);

  if (holding) {
    const currentInvested = holding.quantity * holding.buyPrice;
    const nextQuantity = holding.quantity + quantity;
    holding.buyPrice = (currentInvested + amount) / nextQuantity;
    holding.quantity = nextQuantity;
  } else {
    active.holdings.push({ symbol: stock.symbol, quantity, buyPrice: stock.price });
  }

  active.cash -= amount;
  selectedHoldingSymbol = stock.symbol;
  addHistory(active, "매수", stock, amount, quantity, { executionPrice: stock.price });
  showToast(`${stock.name} ${quantity.toFixed(4)}주 · ${formatWon(stock.price)} 체결`);
  render();
}

function sellHolding(symbol, requestedAmount = null) {
  if (isClosed()) {
    showToast("종료된 리그에서는 거래할 수 없습니다.");
    return;
  }

  const active = getActiveParticipant();
  const holdingIndex = active?.holdings.findIndex((item) => item.symbol === symbol) ?? -1;
  if (holdingIndex === -1) return;

  const holding = active.holdings[holdingIndex];
  const stock = getStock(symbol);
  const maxAmount = holding.quantity * stock.price;
  const amount = requestedAmount === null ? maxAmount : Number(requestedAmount);

  if (!amount || amount < 10000) {
    showToast("매도 금액은 1만원 이상 입력해주세요.");
    return;
  }

  if (amount > maxAmount + 1) {
    showToast("보유 평가금액보다 많이 팔 수 없습니다.");
    return;
  }

  const sellQuantity = Math.min(holding.quantity, amount / stock.price);
  const sellAmount = sellQuantity * stock.price;
  const invested = sellQuantity * holding.buyPrice;
  const realizedProfit = sellAmount - invested;
  const realizedRate = invested ? (realizedProfit / invested) * 100 : 0;
  active.cash += sellAmount;

  if (sellQuantity >= holding.quantity - 0.000001) {
    active.holdings.splice(holdingIndex, 1);
    selectedHoldingSymbol = "";
  } else {
    holding.quantity -= sellQuantity;
  }

  addHistory(active, "매도", stock, sellAmount, sellQuantity, { executionPrice: stock.price, realizedProfit, realizedRate });
  showToast(`${stock.name} ${sellQuantity.toFixed(4)}주 · ${formatWon(stock.price)} 매도 체결`);
  render();
}

async function selectStock(symbol) {
  state.selectedSymbol = symbol;
  renderStocks();
  renderChart();
  await loadSelectedChart();
  saveState();
}

async function selectHoldingForSell(symbol) {
  selectedHoldingSymbol = symbol;
  state.selectedSymbol = symbol;
  render();
  await loadSelectedChart();
  saveState();
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
    tab.classList.add("active");
    document.querySelector(`#${tab.dataset.view}`).classList.add("active");
  });
});

els.leagueForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const nextName = els.leagueInput.value.trim() || "새싹 투자왕 리그";
  const nextEndDate = els.endDateInput.value || state.league.endDate;
  const isChanged = nextName !== state.league.name || nextEndDate !== state.league.endDate;
  if (isChanged && state.participants.length) {
    const confirmed = window.confirm(
      "리그 설정을 수정하면 참여자와 거래 기록에 영향을 줄 수 있습니다. 계속 저장할까요?"
    );
    if (!confirmed) {
      render();
      return;
    }
  }
  state.league.name = nextName;
  state.league.endDate = nextEndDate;
  if (state.league.status === "CLOSED" && !isPastEndDate(state.league.endDate)) state.league.status = "ACTIVE";
  showToast("리그 설정을 저장했습니다.");
  render();
});

els.newLeagueBtn.addEventListener("click", startNewLeague);

els.deleteLeagueBtn.addEventListener("click", deleteCurrentLeague);

els.joinForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (isClosed()) {
    showToast("종료된 리그에는 참여할 수 없습니다. 새 리그를 시작해주세요.");
    return;
  }

  const nickname = els.nicknameInput.value.trim();
  if (!nickname) {
    showToast("닉네임을 입력해주세요.");
    return;
  }

  const normalizedNickname = normalize(nickname);
  const exists = state.participants.some((participant) => normalize(participant.nickname) === normalizedNickname);
  if (exists) {
    showToast("이미 참여한 닉네임입니다.");
    return;
  }

  const urlTicket = new URLSearchParams(window.location.search).get("ticket");
  const currentTicket = state.league.ticket;
  if (urlTicket && urlTicket !== currentTicket) {
    showToast("현재 리그의 링크 티켓이 아닙니다. 새 링크로 다시 접속해주세요.");
    return;
  }

  const claimKey = `${currentTicket}:${normalizedNickname}`;
  if (state.claimedTickets.includes(claimKey)) {
    showToast("이미 이 리그에서 1,000만원을 받은 아이디입니다.");
    return;
  }

  const id = `p${Date.now()}`;
  state.participants.push({ id, nickname, ticket: currentTicket, cash: getInitialCash(), holdings: [], history: [] });
  state.claimedTickets.push(claimKey);
  state.activeParticipantId = id;
  els.nicknameInput.value = "";
  showToast(`${nickname}님에게 1,000만원을 지급했습니다.`);
  render();
});

els.activeUserSelect.addEventListener("change", (event) => {
  state.activeParticipantId = event.target.value;
  render();
});

els.stockSearchInput.addEventListener("input", async (event) => {
  state.searchQuery = event.target.value;
  await refreshStocks(state.searchQuery);
  const filteredStocks = getFilteredStocks();
  if (filteredStocks.length === 1) {
    await selectStock(filteredStocks[0].symbol);
  } else {
    renderStocks();
  }
  saveState();
});

els.stockSearchInput.addEventListener("keydown", async (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  const filteredStocks = getFilteredStocks();
  if (!filteredStocks.length) {
    showToast("검색된 종목이 없습니다.");
    return;
  }
  await selectStock(filteredStocks[0].symbol);
  showToast(`${filteredStocks[0].name} 선택 완료`);
});

els.stockList.addEventListener("click", async (event) => {
  const card = event.target.closest(".stock-card");
  if (!card) return;
  await selectStock(card.dataset.symbol);
});

els.chartTabs.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-range]");
  if (!button) return;
  state.chartRange = button.dataset.range;
  renderChart();
  await loadSelectedChart();
  saveState();
});

els.buyForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await buySelectedStock();
});

els.sellForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const amount = Number(els.sellAmountInput.value.replaceAll(",", ""));
  if (!selectedHoldingSymbol) {
    showToast("매도할 보유 종목을 먼저 선택해주세요.");
    return;
  }
  sellHolding(selectedHoldingSymbol, amount);
});

els.sellFullBtn.addEventListener("click", () => {
  if (!selectedHoldingSymbol) {
    showToast("매도할 보유 종목을 먼저 선택해주세요.");
    return;
  }
  sellHolding(selectedHoldingSymbol);
});

els.holdingsList.addEventListener("click", (event) => {
  const row = event.target.closest(".holding-row");
  if (!row) return;
  selectHoldingForSell(row.dataset.symbol);
});

els.closeLeagueBtn.addEventListener("click", () => {
  const confirmed = window.confirm(
    "리그를 종료하면 더 이상 참여와 거래를 할 수 없습니다. 종료할까요?"
  );
  if (!confirmed) return;
  state.league.status = "CLOSED";
  state.closedLeagues.push({
    name: state.league.name,
    status: "CLOSED",
    endedAt: new Date().toLocaleDateString("ko-KR"),
    participantCount: state.participants.length
  });
  showToast("리그가 종료되어 최종 순위가 고정되었습니다.");
  render();
});

render();
loadKrxMaster().then(() => refreshStocks()).finally(async () => {
  render();
  await loadSelectedChart();
});
