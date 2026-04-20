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

  await page.locator("#nicknameInput").fill("회계테스트");
  await page.locator("#joinForm button").click();
  await page.locator("[data-view=tradeView]").click();
  await page.locator("#stockSearchInput").fill("삼성전자");
  await page.waitForTimeout(1000);
  await page.locator("#buyAmountInput").fill("1000000");
  await page.locator("#buyForm button").click();
  await page.waitForTimeout(500);

  const afterBuyCash = await page.locator("#cashBalance").textContent();
  const afterBuyAsset = await page.locator("#totalAsset").textContent();
  const holdingCount = await page.locator(".holding-row").count();

  await page.locator(".holding-row").first().click();
  await page.locator("#sellFullBtn").click();
  await page.waitForTimeout(500);
  const afterSellCash = await page.locator("#cashBalance").textContent();
  const afterSellAsset = await page.locator("#totalAsset").textContent();
  const holdingAfterSell = await page.locator(".holding-row").count();

  await page.locator("[data-view=rankingView]").click();
  const rankingText = await page.locator("#rankingList").innerText();
  await page.locator('[data-view="leagueView"]').click();
  await page.locator(".league-admin summary").click();
  page.once("dialog", async (dialog) => {
    await dialog.accept();
  });
  await page.locator("#closeLeagueBtn").click();
  await page.waitForTimeout(300);
  await page.locator("[data-view=tradeView]").click();
  await page.locator("#buyForm button").click();
  await page.waitForTimeout(300);
  const toast = await page.locator("#toast").textContent();

  console.log(JSON.stringify({
    afterBuyCash,
    afterBuyAsset,
    holdingCount,
    afterSellCash,
    afterSellAsset,
    holdingAfterSell,
    rankingText,
    toast,
    errors
  }));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
