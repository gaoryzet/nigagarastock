const { chromium } = require("C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  const urls = [];

  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("request", (request) => {
    if (request.url().includes("/functions/v1/quick-handler") && request.url().includes("mode=chart")) {
      urls.push(request.url());
    }
  });

  await page.goto("file:///C:/Users/PC/Documents/Codex/2026-04-20-100/niga-gara-investment-king/index.html", {
    waitUntil: "domcontentloaded"
  });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("[data-view=tradeView]").click();

  const tabs = await page.locator(".chart-tabs button").evaluateAll((buttons) => buttons.map((button) => button.textContent.trim()));
  await page.locator('.chart-tabs button[data-range="1d"]').click();
  await page.waitForTimeout(700);
  const active1 = await page.locator(".chart-tabs button.active").textContent();
  await page.locator('.chart-tabs button[data-range="1y"]').click();
  await page.waitForTimeout(700);
  const active2 = await page.locator(".chart-tabs button.active").textContent();
  const chartSvg = await page.locator("#priceChart svg").count();
  const title = await page.locator("#chartTitle").textContent();

  console.log(JSON.stringify({ tabs, active1, active2, chartSvg, title, urls: urls.slice(-3), errors }));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
