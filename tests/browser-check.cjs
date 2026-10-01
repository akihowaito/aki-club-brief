const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const URL = process.env.TEST_URL || 'http://127.0.0.1:4178';
const artifacts = path.resolve(process.env.ARTIFACT_DIR || path.join(__dirname, '../../../work'));
const DRAFT_KEY = 'aki_club_brief_draft_v1';
const CONFIG_KEY = 'aki_club_brief_template_v1';
const tail = '长图最后一句也要完整保留 END_OF_BRIEF';
const longText = '白色为主，彩色作为点缀。移动端需要清楚的导航和联系方式。'.repeat(35) + tail;

(async () => {
  await fs.mkdir(artifacts, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    window.__paintedText = [];
    const original = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (text, x, y, ...rest) {
      window.__paintedText.push({ text, x, y, width: this.canvas.width, height: this.canvas.height });
      return original.call(this, text, x, y, ...rest);
    };
  });
  let checks = 0;
  const pass = (name) => { checks++; console.log(`PASS ${name}`); };
  const step = async (index) => {
    await page.locator(`.step-link[data-step="${index}"]`).click();
    assert.equal(await page.locator(`.step-panel[data-step="${index}"]`).isVisible(), true);
  };
  const saved = () => page.waitForFunction(() => document.querySelector('#saveStatus').dataset.state === 'saved');
  const focus = async (id) => assert.equal(await page.evaluate(() => document.activeElement.id), id);
  const download = async (button, file) => {
    const [item] = await Promise.all([page.waitForEvent('download'), page.locator(button).click()]);
    await item.saveAs(path.join(artifacts, file));
    return fs.readFile(path.join(artifacts, file));
  };
  const confirm = async (action) => {
    const dialog = page.waitForEvent('dialog').then(async (dialog) => {
      assert.equal(dialog.type(), 'confirm');
      await dialog.accept();
    });
    await Promise.all([dialog, action()]);
  };
  const storage = () => page.evaluate(([draft, config]) => ({ draft: localStorage.getItem(draft), config: localStorage.getItem(config) }), [DRAFT_KEY, CONFIG_KEY]);

  try {
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('#styleChoices input', { state: 'attached' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('#previewBtn').click();
    assert.equal(await page.locator('#previewDialog').evaluate((dialog) => dialog.open), false);
    await focus('clubName');
    pass('空名称阻止生成并聚焦必填字段');

    await page.locator('#clubName').fill('浏览器验收俱乐部');
    await page.locator('#clubEnglish').fill('BROWSER CLUB');
    await page.locator('#games').fill('三角洲行动、无畏契约');
    await page.locator('#audience').fill('大学生玩家');
    await step(1);
    await page.locator('input[name="styles"][value="简约现代"]').locator('..').click();
    await page.locator('#brandColor').fill('白色');
    await page.locator('#accentColor').fill('蓝、绿、橙、粉');
    await page.locator('#brandKeywords').fill('清爽、年轻');
    await step(2);
    await page.locator('#menuCount').fill('30 张');
    await page.locator('#staffCount').fill('12 位');
    await page.locator('#menuCategories').fill('推荐 / 陪玩');
    await page.locator('#contentModules').fill('热门菜单、成员和最新活动');
    await step(3);
    await page.locator('input[name="features"][value="菜单搜索"]').locator('..').click();
    await page.locator('input[name="features"][value="客服联系"]').locator('..').click();
    await step(4);
    await page.locator('#contactMethods').fill('微信 / QQ');
    await page.locator('#contactId').fill('test-contact');
    await page.locator('#businessHours').fill('9:00–02:00');
    await page.locator('#domain').fill('https://example.com/');
    await page.locator('input[name="deploy"][value="GitHub Pages"]').locator('..').click();
    await step(5);
    await page.locator('input[name="materials"][value="LOGO"]').locator('..').click();
    await page.locator('#reference').fill('https://www.bitleap.vip/');
    await page.locator('#extra').fill(longText);
    await saved();
    assert.match(await page.locator('#summaryName').innerText(), /浏览器验收俱乐部/);
    assert.match(await page.locator('#summaryGames').innerText(), /三角洲行动/);
    assert.match(await page.locator('#summaryStyle').innerText(), /简约现代/);
    assert.match(await page.locator('#summaryFeatures').innerText(), /2/);
    assert.match(await page.locator('#summaryDeploy').innerText(), /GitHub Pages/);
    assert.match(await page.locator('#summaryProgress').innerText(), /6\s*\/\s*6/);
    pass('六个步骤可填写，选择更新实时摘要与进度');

    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('#clubName').inputValue(), '浏览器验收俱乐部');
    assert.equal(await page.locator('#extra').inputValue(), longText);
    assert.equal(await page.locator('input[name="styles"][value="简约现代"]').isChecked(), true);
    assert.equal(await page.locator('input[name="deploy"][value="GitHub Pages"]').isChecked(), true);
    pass('刷新后恢复本地草稿和勾选项');

    await step(4);
    await page.locator('#domain').fill('not-a-valid-url');
    await step(0);
    await page.locator('#previewBtn').click();
    assert.equal(await page.locator('#previewDialog').evaluate((dialog) => dialog.open), false);
    assert.equal(await page.locator('.step-panel[data-step="4"]').isVisible(), true);
    await focus('domain');
    await page.locator('#domain').fill('https://example.com/');
    await page.locator('#previewBtn').click();
    await page.locator('#previewDialog').waitFor({ state: 'visible' });
    const brief = await page.locator('#previewText').innerText();
    for (const value of ['浏览器验收俱乐部', '白色', '菜单搜索', 'GitHub Pages', 'LOGO', tail]) assert.ok(brief.includes(value), `需求单缺少 ${value}`);
    pass('错误网址阻止预览并定位联系步骤，修正后需求完整');

    const text = (await download('#textBtn', 'brief.txt')).toString('utf8').replace(/^\uFEFF/, '');
    assert.equal(text, brief);
    pass('TXT 真实下载且内容与预览完全一致');
    await page.locator('#imageBtn').click();
    await page.locator('#imageDialog').waitFor({ state: 'visible' });
    await page.waitForFunction(() => document.querySelector('#exportImage').complete && document.querySelector('#exportImage').naturalWidth > 0);
    const picture = await page.locator('#exportImage').evaluate((image) => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);
      const pixels = ctx.getImageData(70, canvas.height - 350, canvas.width - 140, 310).data;
      let ink = 0;
      for (let i = 0; i < pixels.length; i += 4) if (pixels[i] < 200 || pixels[i + 1] < 200 || pixels[i + 2] < 200) ink++;
      return { width: canvas.width, height: canvas.height, ink, painted: window.__paintedText };
    });
    assert.equal(picture.width, 1080);
    assert.ok(picture.height > 1000);
    assert.ok(picture.ink > 20, 'PNG 底部应有正文或页脚笔迹');
    const sentinelRows = picture.painted.filter((row) => row.text.includes('END_OF_BRIEF'));
    assert.equal(sentinelRows.length, 1, '长正文末尾没有绘制');
    assert.ok(sentinelRows[0].y < picture.height - 40, '末尾正文被画布截断');
    const png = await download('#downloadImageBtn', 'long-brief.png');
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(png.readUInt32BE(16), 1080);
    assert.equal(png.readUInt32BE(20), picture.height);
    await page.screenshot({ path: path.join(artifacts, 'image-preview.png') });
    pass(`PNG 真实下载、1080×${picture.height}、长正文末尾及底部可见`);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#imageDialog').evaluate((dialog) => dialog.open), false);
    await focus('imageBtn');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#previewDialog').evaluate((dialog) => dialog.open), false);
    await focus('previewBtn');
    pass('Esc 逐层关闭弹窗并返回原触发按钮');

    await page.locator('#settingsBtn').click();
    const materials = await page.locator('#setMaterials').inputValue();
    await page.locator('#setMaterials').fill(materials + '\n品牌短片');
    const styles = await page.locator('#setStyles').inputValue();
    await page.locator('#setStyles').fill(styles + '\n白底彩色');
    await page.locator('#setBrandTitle').fill('AKI TEST STUDIO');
    await page.locator('#saveTemplateBtn').click();
    await saved();
    assert.equal(await page.locator('#settingsDialog').evaluate((dialog) => dialog.open), false);
    assert.equal(await page.locator('#clubName').inputValue(), '浏览器验收俱乐部');
    assert.equal(await page.locator('input[name="styles"][value="简约现代"]').isChecked(), true);
    assert.equal(await page.locator('input[name="materials"][value="LOGO"]').isChecked(), true);
    assert.equal(await page.locator('input[name="materials"][value="品牌短片"]').count(), 1);
    assert.match(await page.locator('#brandTitle').innerText(), /AKI TEST STUDIO/);
    pass('模板支持素材选项，保存后保留文字和原有选择');

    const backupBytes = await download('#exportDraftBtn', 'backup.json');
    const backup = JSON.parse(backupBytes.toString());
    assert.equal(backup.data.clubName, '浏览器验收俱乐部');
    assert.equal(backup.data.extra, longText);
    assert.ok(backup.config.materials.includes('品牌短片'));
    await confirm(() => page.locator('#clearDraftBtn').click());
    assert.equal(await page.locator('#clubName').inputValue(), '');
    assert.equal(await page.locator('#extra').inputValue(), '');
    assert.equal(await page.locator('input[name="styles"]:checked').count(), 0);
    assert.match(await page.locator('#brandTitle').innerText(), /AKI TEST STUDIO/);
    await confirm(() => page.locator('#importFile').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: backupBytes }));
    assert.equal(await page.locator('#clubName').inputValue(), '浏览器验收俱乐部');
    assert.equal(await page.locator('#extra').inputValue(), longText);
    assert.equal(await page.locator('input[name="deploy"][value="GitHub Pages"]').isChecked(), true);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('#clubName').inputValue(), backup.data.clubName);
    pass('JSON 真实导出、确认清空、确认覆盖导入并持久恢复');

    const beforeInvalidImport = await storage();
    let unwantedConfirmation = false;
    const rejectDialog = async (dialog) => { unwantedConfirmation = true; await dialog.dismiss(); };
    page.on('dialog', rejectDialog);
    await page.locator('#importFile').setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{ invalid json') });
    await page.waitForFunction(() => /JSON/.test(document.querySelector('#toast').textContent));
    assert.deepEqual(await storage(), beforeInvalidImport);
    await page.locator('#importFile').setInputFiles({ name: 'wrong.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ ...backup, data: { ...backup.data, styles: ['未知样式'] } })) });
    await page.waitForFunction(() => /不一致|支持|格式/.test(document.querySelector('#toast').textContent));
    assert.deepEqual(await storage(), beforeInvalidImport);
    assert.equal(await page.locator('#clubName').inputValue(), backup.data.clubName);
    assert.equal(unwantedConfirmation, false);
    page.off('dialog', rejectDialog);
    pass('语法错误与结构错误备份均拒绝，未破坏项目或模板');

    await step(2);
    await page.locator('#contentModules').fill('完整中文内容'.repeat(830));
    await step(5);
    await page.locator('#reference').fill('完整中文内容'.repeat(830));
    await page.locator('#extra').fill('完整中文内容'.repeat(830));
    await page.locator('#previewBtn').click();
    await page.locator('#imageBtn').click();
    await page.waitForFunction(() => /过长|缩短/.test(document.querySelector('#toast').textContent));
    assert.equal(await page.locator('#imageDialog').evaluate((dialog) => dialog.open), false);
    assert.equal(await page.locator('#imageBtn').isEnabled(), true);
    await page.keyboard.press('Escape');
    pass('超出画布长度时明确拒绝 PNG，提供文字下载建议');
    await confirm(() => page.locator('#importFile').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: backupBytes }));
    await page.waitForFunction(() => !document.querySelector('#toast').classList.contains('show'));

    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: width >= 768 ? 1000 : 844 });
      for (let index = 0; index < 6; index++) {
        await step(index);
        const size = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: innerWidth }));
        assert.ok(size.scroll <= size.viewport + 1, `${width}px 第 ${index + 1} 步出现横向溢出 ${size.scroll}`);
      }
      await step(0);
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
      if (width === 390 || width === 1440) await page.screenshot({ path: path.join(artifacts, width === 390 ? 'mobile.png' : 'desktop.png'), fullPage: true });
    }
    pass('320 / 390 / 768 / 1440 宽度，六个步骤均无页面横向溢出');
    assert.deepEqual(errors, [], '浏览器出现未处理的脚本错误');
    console.log(`\n${checks} checks passed. Screenshots and downloads: ${artifacts}`);
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
