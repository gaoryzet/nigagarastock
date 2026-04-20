const { chromium } = require("C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  const dialogs = [];

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

  const initialState = await page.evaluate(() => ({
    adminOpen: document.querySelector(".league-admin")?.open,
    resumeCount: document.querySelectorAll("#resumeLeagueBtn").length,
    leagueFormVisible: !!document.querySelector(".league-admin #leagueForm"),
    rankingCloseButtonCount: document.querySelectorAll("#rankingView #closeLeagueBtn").length
  }));

  await page.locator("#nicknameInput").fill("관리테스트");
  await page.locator("#joinForm button").click();
  await page.waitForTimeout(200);

  await page.locator(".league-admin summary").click();
  await page.locator("#leagueInput").fill("수정취소리그");
  page.once("dialog", async (dialog) => {
    dialogs.push({ type: "edit-cancel", message: dialog.message() });
    await dialog.dismiss();
  });
  await page.locator("#leagueForm button").click();
  await page.waitForTimeout(200);
  const afterEditCancel = await page.locator("#leagueName").textContent();

  await page.locator("#leagueInput").fill("수정완료리그");
  page.once("dialog", async (dialog) => {
    dialogs.push({ type: "edit-confirm", message: dialog.message() });
    await dialog.accept();
  });
  await page.locator("#leagueForm button").click();
  await page.waitForTimeout(200);
  const afterEditConfirm = await page.locator("#leagueName").textContent();

  page.once("dialog", async (dialog) => {
    dialogs.push({ type: "delete-cancel", message: dialog.message() });
    await dialog.dismiss();
  });
  await page.locator("#deleteLeagueBtn").click();
  await page.waitForTimeout(200);
  const participantsAfterDeleteCancel = await page.locator(".person").count();

  page.once("dialog", async (dialog) => {
    dialogs.push({ type: "delete-confirm", message: dialog.message() });
    await dialog.accept();
  });
  await page.locator("#deleteLeagueBtn").click();
  await page.waitForTimeout(200);
  const participantsAfterDeleteConfirm = await page.locator(".person").count();
  const leagueNameAfterDelete = await page.locator("#leagueName").textContent();

  console.log(JSON.stringify({
    initialState,
    afterEditCancel,
    afterEditConfirm,
    participantsAfterDeleteCancel,
    participantsAfterDeleteConfirm,
    leagueNameAfterDelete,
    dialogs,
    errors
  }));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
