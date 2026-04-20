const { chromium } = require("C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const STORAGE_KEY = "nigaGaraInvestmentKingStateV5";
const appUrl = "file:///C:/Users/PC/Documents/Codex/2026-04-20-100/niga-gara-investment-king/index.html";

function isoDateAfter(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function expectedDaysLeft(endDate) {
  const end = new Date(`${endDate}T23:59:59`);
  return Math.max(0, Math.ceil((end - new Date()) / 86400000));
}

function makeState(endDate) {
  return {
    league: {
      name: "Summary Test League",
      ticket: "TICKET-SUMMARY",
      initialCash: 10000000,
      endDate,
      status: "ACTIVE"
    },
    activeParticipantId: "p2",
    selectedSymbol: "005930",
    searchQuery: "",
    chartRange: "1mo",
    claimedTickets: ["TICKET-SUMMARY:alpha", "TICKET-SUMMARY:beta"],
    participants: [
      { id: "p1", nickname: "alpha", ticket: "TICKET-SUMMARY", cash: 11000000, holdings: [], history: [] },
      { id: "p2", nickname: "beta", ticket: "TICKET-SUMMARY", cash: 9000000, holdings: [], history: [] }
    ],
    closedLeagues: []
  };
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
  });
  const errors = [];

  async function readSummary(state) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(({ key, value }) => {
      localStorage.setItem(key, JSON.stringify(value));
    }, { key: STORAGE_KEY, value: state });
    const page = await context.newPage();

    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    await page.goto(appUrl, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(700);

    const summary = await page.evaluate(() => ({
      initialCash: document.querySelector("#initialCash")?.textContent,
      daysLeft: document.querySelector("#daysLeft")?.textContent,
      myRank: document.querySelector("#myRank")?.textContent,
      leagueStatus: document.querySelector("#leagueStatus")?.textContent
    }));

    await context.close();
    return summary;
  }

  const futureEndDate = isoDateAfter(3);
  const pastEndDate = isoDateAfter(-1);
  const activeSummary = await readSummary(makeState(futureEndDate));
  const expiredSummary = await readSummary(makeState(pastEndDate));

  console.log(JSON.stringify({
    expectedActiveDays: `${expectedDaysLeft(futureEndDate)}일`,
    activeSummary,
    expiredSummary,
    errors
  }));

  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
