const { chromium } = require("C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];

  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("file:///C:/Users/PC/Documents/Codex/2026-04-20-100/niga-gara-investment-king/index.html", {
    waitUntil: "domcontentloaded"
  });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);

  await page.locator("#nicknameInput").fill("매수위치테스트");
  await page.locator("#joinForm button").click();
  await page.locator('[data-view="tradeView"]').click();
  await page.waitForTimeout(300);

  const order = await page.evaluate(() => {
    const trade = document.querySelector("#tradeView");
    const chart = trade.querySelector(".chart-panel");
    const buy = trade.querySelector("#buyForm");
    const stockList = trade.querySelector("#stockList");
    return {
      chartBeforeBuy: chart.compareDocumentPosition(buy) === Node.DOCUMENT_POSITION_FOLLOWING,
      buyBeforeStockList: buy.compareDocumentPosition(stockList) === Node.DOCUMENT_POSITION_FOLLOWING
    };
  });

  await page.locator("#buyAmountInput").fill("1000000");
  await page.locator("#buyForm button").click();
  await page.waitForTimeout(1000);

  const afterBuyCash = await page.locator("#cashBalance").textContent();
  const holdingCount = await page.locator(".holding-card").count();

  console.log(JSON.stringify({ order, afterBuyCash, holdingCount, errors }));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
