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

  const ticket1 = await page.locator("#inviteCode").textContent();
  const link1 = await page.locator("#inviteLink").textContent();

  await page.locator("#nicknameInput").fill("중복테스트");
  await page.locator("#joinForm button").click();
  await page.waitForTimeout(200);
  const participants1 = await page.locator(".person").count();

  await page.locator("#nicknameInput").fill("중복테스트");
  await page.locator("#joinForm button").click();
  await page.waitForTimeout(200);
  const duplicateToast = await page.locator("#toast").textContent();
  const participants2 = await page.locator(".person").count();

  await page.locator("#newLeagueBtn").click();
  await page.waitForTimeout(200);
  const ticket2 = await page.locator("#inviteCode").textContent();
  await page.locator("#nicknameInput").fill("중복테스트");
  await page.locator("#joinForm button").click();
  await page.waitForTimeout(200);
  const participants3 = await page.locator(".person").count();
  const cash = await page.locator(".person .muted").first().textContent();

  console.log(JSON.stringify({ ticket1, link1, participants1, duplicateToast, participants2, ticket2, participants3, cash, errors }));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
