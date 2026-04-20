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

  await page.locator("#nicknameInput").fill("부분매도테스트");
  await page.locator("#joinForm button").click();
  await page.locator('[data-view="tradeView"]').click();
  await page.waitForTimeout(300);

  const disabledBeforeHolding = await page.locator("#sellSubmitBtn").isDisabled();
  await page.locator("#buyAmountInput").fill("1000000");
  await page.locator("#buyForm button").click();
  await page.waitForTimeout(800);

  const afterBuyCash = await page.locator("#cashBalance").textContent();
  const executionAfterBuy = await page.locator("#executionPanel").innerText();
  const holdingTextAfterBuy = await page.locator(".holding-row").first().innerText();
  const sellEnabledAfterBuy = !(await page.locator("#sellSubmitBtn").isDisabled());

  await page.locator("#sellAmountInput").fill("400000");
  await page.locator("#sellSubmitBtn").click();
  await page.waitForTimeout(500);

  const afterPartialCash = await page.locator("#cashBalance").textContent();
  const executionAfterPartialSell = await page.locator("#executionPanel").innerText();
  const holdingCountAfterPartial = await page.locator(".holding-row").count();
  const holdingTextAfterPartial = await page.locator(".holding-row").first().innerText();

  await page.locator(".holding-row").first().click();
  await page.locator("#sellFullBtn").click();
  await page.waitForTimeout(500);

  const afterFullCash = await page.locator("#cashBalance").textContent();
  const executionAfterFullSell = await page.locator("#executionPanel").innerText();
  const holdingCountAfterFull = await page.locator(".holding-row").count();
  const sellDisabledAfterFull = await page.locator("#sellSubmitBtn").isDisabled();

  console.log(JSON.stringify({
    disabledBeforeHolding,
    afterBuyCash,
    executionAfterBuy,
    holdingTextAfterBuy,
    sellEnabledAfterBuy,
    afterPartialCash,
    executionAfterPartialSell,
    holdingCountAfterPartial,
    holdingTextAfterPartial,
    afterFullCash,
    executionAfterFullSell,
    holdingCountAfterFull,
    sellDisabledAfterFull,
    errors
  }));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
