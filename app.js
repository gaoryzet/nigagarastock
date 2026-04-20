const INITIAL_CASH = 10000000;
const STORAGE_KEY = "nigaGaraInvestmentKingStateV3";

const DEFAULT_STOCKS = [
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

let stocks = [...DEFAULT_STOCKS];

function createEndDate(days = 14) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function createInviteCode() {
  return `KING-${Math.floor(1000 + Math.random() * 9000)}`;
}

function createInitialState() {
  return {
    league: {
      name: "새싹 투자왕 리그",
      inviteCode: "KING-1000",
      initialCash: INITIAL_CASH,
      endDate: createEndDate(),
      status: "ACTIVE"
    },
    activeParticipantId: "",
    selectedSymbol: "005930",
    searchQuery: "",
    participants: [],
    closedLeagues: []
  };
}

let state = loadState();

const els = {
  leagueName: document.querySelector("#leagueName"),
  leagueStatus: document.querySelector("#leagueStatus"),
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
  resumeLeagueBtn: document.querySelector("#resumeLeagueBtn"),
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
  stockList: document.querySelector("#stockList"),
  buyForm: document.querySelector("#buyForm"),
  buyAmountInput: document.querySelector("#buyAmountInput"),
  holdingsList: document.querySelector("#holdingsList"),
  rankingList: document.querySelector("#rankingList"),
  historyList: document.querySelector("#historyList"),
  closeLeagueBtn: document.querySelector("#closeLeagueBtn"),
  toast: document.querySelector("#toast")
};

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const nextState = stored ? JSON.parse(stored) : createInitialState();
    return normalizeState(nextState);
  } catch {
    return createInitialState();
  }
}

function normalizeState(nextState) {
  const base = createInitialState();
  const merged = { ...base, ...nextState };
  merged.league = { ...base.league, ...(nextState.league || {}) };
  merged.participants = Array.isArray(nextState.participants) ? nextState.participants : [];
  merged.closedLeagues = Array.isArray(nextState.closedLeagues) ? nextState.closedLeagues : [];
  if (!merged.participants.some((participant) => participant.id === merged.activeParticipantId)) {
    merged.activeParticipantId = merged.participants[0]?.id || "";
  }
  return merged;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatWon(value) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function formatRate(value) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(2)}%`;
}

function normalize(value) {
  return String(value).replace(/\s/g, "").toLowerCase();
}

function getStock(symbol) {
  return stocks.find((stock) => stock.symbol === symbol) || DEFAULT_STOCKS.find((stock) => stock.symbol === symbol);
}

function getFilteredStocks() {
  const query = normalize(state.searchQuery || "");
  if (!query) return stocks;

  return stocks.filter((stock) => {
    return (
      normalize(stock.name).includes(query) ||
      normalize(stock.symbol).includes(query) ||
      normalize(stock.market).includes(query)
    );
  });
}

function hasMarketApi() {
  return Boolean(window.NGIK_CONFIG?.MARKET_DATA_FUNCTION_URL);
}

async function fetchMarketData(query = "") {
  if (!hasMarketApi()) return null;

  const url = new URL(window.NGIK_CONFIG.MARKET_DATA_FUNCTION_URL);
  if (query) url.searchParams.set("query", query);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Market API error: ${response.status}`);
  }

  const payload = await response.json();
  return Array.isArray(payload.stocks) ? payload.stocks : null;
}

async function refreshStocks(query = "") {
  try {
    const remoteStocks = await fetchMarketData(query);
    if (!remoteStocks?.length) return;

    stocks = remoteStocks.map((stock) => ({
      symbol: String(stock.symbol),
      name: String(stock.name),
      market: String(stock.market || "UNKNOWN"),
      price: Number(stock.price),
      change: Number(stock.change || 0)
    }));

    if (!getStock(state.selectedSymbol)) {
      state.selectedSymbol = stocks[0].symbol;
    }
  } catch (error) {
    console.warn(error);
    showToast("시세 API 연결 실패. 샘플 가격으로 계속 진행합니다.");
  }
}

function calculateParticipant(participant) {
  const valuation = participant.holdings.reduce((sum, holding) => {
    const stock = getStock(holding.symbol);
    return stock ? sum + holding.quantity * stock.price : sum;
  }, 0);
  const totalAsset = participant.cash + valuation;
  const profit = totalAsset - INITIAL_CASH;
  const returnRate = (profit / INITIAL_CASH) * 100;
  return { valuation, totalAsset, profit, returnRate };
}

function getRankings() {
  return state.participants
    .map((participant) => ({
      ...participant,
      metrics: calculateParticipant(participant)
    }))
    .sort((a, b) => {
      if (b.metrics.totalAsset !== a.metrics.totalAsset) {
        return b.metrics.totalAsset - a.metrics.totalAsset;
      }
      if (b.metrics.returnRate !== a.metrics.returnRate) {
        return b.metrics.returnRate - a.metrics.returnRate;
      }
      return a.nickname.localeCompare(b.nickname, "ko-KR");
    });
}

function getActiveParticipant() {
  return state.participants.find((item) => item.id === state.activeParticipantId) || state.participants[0] || null;
}

function isClosed() {
  return state.league.status === "CLOSED";
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
  els.inviteCode.textContent = state.league.inviteCode;
  const inviteUrl = `${window.location.href.split("?")[0]}?join=${encodeURIComponent(state.league.inviteCode)}`;
  els.inviteLink.href = inviteUrl;
  els.inviteLink.textContent = inviteUrl;
  els.daysLeft.textContent = isClosed() ? "종료" : `${daysLeft}일`;
  els.myRank.textContent = activeRank ? `${activeRank}위` : "참여 전";
  els.leagueStatus.textContent = isClosed() ? "종료됨" : "진행 중";
  els.leagueStatus.classList.toggle("closed", isClosed());
}

function renderLeagueManagement() {
  els.activeLeagueLabel.textContent = state.league.name;
  els.activeLeagueMeta.textContent = isClosed()
    ? "이 리그는 종료되었습니다. 새 리그를 시작하거나 진행 재개를 누르세요."
    : `${state.participants.length}명 참여 중 · 종료일 ${state.league.endDate}`;
  els.closedLeagueCount.textContent = `${state.closedLeagues.length}개`;
  els.closedLeagueList.textContent = state.closedLeagues.length
    ? state.closedLeagues.map((league) => league.name).slice(-3).join(", ")
    : "아직 종료된 리그가 없습니다.";
  els.resumeLeagueBtn.disabled = !isClosed();
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
      <p>${stock.symbol} · ${stock.market}</p>
    </div>
    <div>
      <strong>${formatWon(stock.price)}</strong>
      <p class="${className}">${formatRate(stock.change)}</p>
    </div>
  `;
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

function renderHoldings() {
  const active = getActiveParticipant();
  if (!active) {
    els.holdingsList.innerHTML = `<p class="empty">리그에서 사용할 닉네임을 먼저 등록해주세요.</p>`;
    return;
  }
  if (!active.holdings.length) {
    els.holdingsList.innerHTML = `<p class="empty">아직 보유 종목이 없습니다.</p>`;
    return;
  }

  els.holdingsList.innerHTML = active.holdings
    .map((holding) => {
      const stock = getStock(holding.symbol);
      const valuation = holding.quantity * stock.price;
      const invested = holding.quantity * holding.buyPrice;
      const profitRate = ((valuation - invested) / invested) * 100;
      const className = profitRate >= 0 ? "gain" : "loss";
      return `
        <div class="holding-row">
          <div>
            <strong>${stock.name}</strong>
            <p class="muted">${holding.quantity.toFixed(4)}주 · ${formatWon(valuation)}</p>
          </div>
          <div class="holding-actions">
            <span class="${className}">${formatRate(profitRate)}</span>
            <button class="ghost-button sell-button" data-symbol="${holding.symbol}">매도</button>
          </div>
        </div>
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
        <span>${formatWon(item.amount)} · ${item.quantity.toFixed(4)}주 · ${item.createdAt}</span>
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
  renderWallet();
  renderHoldings();
  renderRankings();
  renderHistory();
  saveState();
}

function addHistory(participant, type, stock, amount, quantity) {
  participant.history.push({
    type,
    stockName: stock.name,
    amount,
    quantity,
    createdAt: new Date().toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })
  });
}

function startNewLeague() {
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
    inviteCode: createInviteCode(),
    initialCash: INITIAL_CASH,
    endDate: els.endDateInput.value || createEndDate(),
    status: "ACTIVE"
  };
  state.participants = [];
  state.activeParticipantId = "";
  state.searchQuery = "";
  showToast("새 리그가 시작되었습니다. 참여자를 등록해주세요.");
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

  await refreshStocks(state.selectedSymbol);
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
  addHistory(active, "매수", stock, amount, quantity);
  showToast(`${stock.name} ${formatWon(amount)} 매수 완료`);
  render();
}

function sellHolding(symbol) {
  if (isClosed()) {
    showToast("종료된 리그에서는 거래할 수 없습니다.");
    return;
  }

  const active = getActiveParticipant();
  const holdingIndex = active?.holdings.findIndex((item) => item.symbol === symbol) ?? -1;
  if (holdingIndex === -1) return;

  const holding = active.holdings[holdingIndex];
  const stock = getStock(symbol);
  const amount = holding.quantity * stock.price;
  active.cash += amount;
  active.holdings.splice(holdingIndex, 1);
  addHistory(active, "매도", stock, amount, holding.quantity);
  showToast(`${stock.name} 전량 매도 완료`);
  render();
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
  state.league.name = els.leagueInput.value.trim() || "새싹 투자왕 리그";
  state.league.endDate = els.endDateInput.value || state.league.endDate;
  if (isClosed()) {
    state.league.status = "ACTIVE";
  }
  showToast("리그 설정을 저장했습니다.");
  render();
});

els.newLeagueBtn.addEventListener("click", () => {
  startNewLeague();
});

els.resumeLeagueBtn.addEventListener("click", () => {
  state.league.status = "ACTIVE";
  showToast("리그를 진행 중으로 되돌렸습니다.");
  render();
});

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

  const exists = state.participants.some((participant) => participant.nickname === nickname);
  if (exists) {
    showToast("이미 참여한 닉네임입니다.");
    return;
  }

  const id = `p${Date.now()}`;
  state.participants.push({ id, nickname, cash: INITIAL_CASH, holdings: [], history: [] });
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
    state.selectedSymbol = filteredStocks[0].symbol;
  }
  renderStocks();
  saveState();
});

els.stockSearchInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  const filteredStocks = getFilteredStocks();
  if (!filteredStocks.length) {
    showToast("검색된 종목이 없습니다.");
    return;
  }
  state.selectedSymbol = filteredStocks[0].symbol;
  renderStocks();
  showToast(`${filteredStocks[0].name} 선택 완료`);
});

els.stockList.addEventListener("click", (event) => {
  const card = event.target.closest(".stock-card");
  if (!card) return;
  state.selectedSymbol = card.dataset.symbol;
  renderStocks();
});

els.buyForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await buySelectedStock();
});

els.holdingsList.addEventListener("click", (event) => {
  const button = event.target.closest(".sell-button");
  if (!button) return;
  sellHolding(button.dataset.symbol);
});

els.closeLeagueBtn.addEventListener("click", () => {
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

refreshStocks().finally(render);
