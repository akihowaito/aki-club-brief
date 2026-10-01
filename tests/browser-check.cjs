const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const URL = process.env.TEST_URL || 'http://127.0.0.1:4178';
const artifacts = path.resolve(process.env.ARTIFACT_DIR || path.join(__dirname, '../../../work/v2-qa'));
const DRAFT_KEY = 'aki_club_brief_draft_v1';
const CONFIG_KEY = 'aki_club_brief_template_v1';
const tail = '长图最后一句也要完整保留 END_OF_BRIEF';
const longText = '白色为主，彩色作为点缀。移动端需要清楚的导航和联系方式。'.repeat(35) + tail;

(async () => {
  await fs.mkdir(artifacts, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const origin = new globalThis.URL(URL).origin;
  const outbound = [];
  const observeRequest = (request) => {
    if (!['GET', 'HEAD'].includes(request.method()) || (/^https?:/.test(request.url()) && !request.url().startsWith(origin + '/'))) outbound.push({ method: request.method(), url: request.url() });
  };
  context.on('request', observeRequest);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    window.__paintedText = [];
    window.__paintedImages = [];
    window.__pdfCrops = [];
    const original = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (text, x, y, ...rest) {
      const bounds = this.measureText(text);
      window.__paintedText.push({ text, x, y, top: y - bounds.actualBoundingBoxAscent, bottom: y + bounds.actualBoundingBoxDescent, width: this.canvas.width, height: this.canvas.height });
      return original.call(this, text, x, y, ...rest);
    };
    const originalImage = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (image, ...args) {
      if (args.length === 4) window.__paintedImages.push({ top: args[1], bottom: args[1] + args[3], width: this.canvas.width, height: this.canvas.height });
      if (args.length === 8 && image instanceof HTMLCanvasElement) window.__pdfCrops.push({ start: args[1], end: args[1] + args[3], width: image.width, height: image.height });
      return originalImage.call(this, image, ...args);
    };
  });
  let checks = 0;
  const pass = (name) => { checks++; console.log(`PASS ${name}`); };
  const step = async (index) => {
    await page.locator(`.step-link[data-step="${index}"]`).click();
    assert.equal(await page.locator(`.step-panel[data-step="${index}"]`).isVisible(), true);
    assert.equal(await page.locator('.step-panel:visible').count(), 1);
  };
  const saved = () => page.waitForFunction(() => document.querySelector('#saveStatus').dataset.state === 'saved');
  const focus = async (id) => assert.equal(await page.evaluate(() => document.activeElement.id), id);
  const download = async (button, file, target = page) => {
    const [item] = await Promise.all([target.waitForEvent('download'), target.locator(button).click()]);
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
  const draft = () => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), DRAFT_KEY);
  const importPayload = (buffer) => page.locator('#importFile').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer });
  const tag = async (id, label, key = 'Enter') => { await page.locator(id).fill(label); await page.locator(id).press(key); };
  const pick = async (name, value) => {
    const label = page.locator(`input[name="${name}"][value="${value}"]`).locator('..');
    await label.click();
    assert.equal(await label.evaluate((element) => element.classList.contains('selected')), true, '选中项需保留旧 WebView 可用的样式 class');
  };
  const clearToast = () => page.evaluate(() => { document.querySelector('#toast').textContent = ''; });
  const rejectImport = async (buffer) => {
    const before = await storage();
    let unexpectedConfirmation = false;
    const rejectDialog = async (dialog) => { unexpectedConfirmation = true; await dialog.dismiss(); };
    page.on('dialog', rejectDialog);
    await clearToast();
    await importPayload(buffer);
    await page.waitForFunction(() => document.querySelector('#toast').textContent.length > 0);
    assert.equal(unexpectedConfirmation, false, '非法备份不应要求确认覆盖');
    assert.deepEqual(await storage(), before, '非法备份改变了原草稿');
    page.off('dialog', rejectDialog);
  };

  try {
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('#styleChoices input', { state: 'attached' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });
    assert.match(await page.title(), /定制化俱乐部网页/);
    assert.equal((await page.locator('#heroTitle').textContent()).replace(/\s/g, ''), '俱乐部网页只为你专属打造');
    assert.match(await page.locator('.hero .eyebrow').innerText(), /CUSTOMIZE YOUR OWN E-SPORTS WEBSITE AT HERE/);
    for (const value of ['双端优化', '审美在线', '不套模板']) assert.ok((await page.locator('.hero-tags').innerText()).includes(value));
    assert.equal(await page.locator('.art-note, #settingsBtn, #settingsDialog').count(), 0);
    const logo = await page.locator('.brand-mark').evaluate((mark) => ({
      text: mark.textContent.trim(), gradient: getComputedStyle(mark).backgroundImage,
      svgGradient: mark.querySelectorAll('linearGradient stop').length >= 4,
      after: getComputedStyle(mark, '::after').content, radius: parseFloat(getComputedStyle(mark).borderRadius), width: mark.clientWidth
    }));
    assert.notEqual(logo.text, 'A');
    assert.ok(/gradient/.test(logo.gradient) || logo.svgGradient, 'Logo 应使用彩虹渐变');
    assert.ok(logo.radius < logo.width / 2, '品牌色块不应是圆形');
    assert.ok(['none', 'normal', '""'].includes(logo.after), 'Logo 不应保留原圆点');
    assert.ok((await page.locator('body').innerText()).includes('akihowaito'));
    assert.equal((await page.locator('body').innerText()).includes('再自行发送给客服'), false);
    pass('定制文案、彩虹 Logo、三项标签与移除模板设置');

    await page.locator('#previewBtn').click();
    assert.equal(await page.locator('#previewDialog').evaluate((dialog) => dialog.open), false);
    await focus('clubName');
    await page.locator('#clubName').fill('浏览器验收俱乐部');
    await page.locator('#clubEnglish').fill('BROWSER CLUB');
    await tag('#gamesEntry', '三角洲行动', 'Space');
    await tag('#gamesEntry', '无畏契约');
    await tag('#gamesEntry', '三角洲行动');
    assert.equal(await page.locator('#gamesTags .tag-chip').count(), 2, '重复游戏不应重复添加');
    await page.locator('#gamesEntry').fill('王者荣耀');
    await page.locator('#gamesEntry').evaluate((entry) => {
      entry.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      entry.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', isComposing: true, bubbles: true }));
      entry.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', isComposing: true, bubbles: true }));
    });
    assert.equal(await page.locator('#gamesTags .tag-chip').count(), 2, '输入法组词期间不应提交');
    await page.locator('#gamesEntry').evaluate((entry) => entry.dispatchEvent(new CompositionEvent('compositionend', { data: '王者荣耀', bubbles: true })));
    await page.locator('#gamesEntry').press('Enter');
    assert.equal(await page.locator('#gamesTags .tag-chip').count(), 3);
    assert.match(await page.locator('#gamesTags').innerText(), /👑.*王者荣耀/s);
    await page.locator('#gamesTags button[aria-label="移除 王者荣耀"]').click();
    assert.equal(await page.locator('#games').inputValue(), '三角洲行动、无畏契约');
    await page.locator('#audience').fill('大学生玩家');
    pass('游戏标签空格 / Enter、去重、IME 组词保护、emoji 与移除');

    await step(1);
    assert.ok(await page.locator('input[name="styles"]').count() >= 21, '品牌风格应至少 20 种加其他');
    assert.equal(await page.locator('#styleOtherField').isVisible(), false);
    await pick('styles', '简约现代');
    await pick('styles', '其他');
    assert.equal(await page.locator('#styleOtherField').isVisible(), true);
    await page.locator('#styleOther').fill('日系文具感');
    await tag('#keywordsEntry', '清爽', 'Space');
    await tag('#keywordsEntry', '年轻');
    await tag('#keywordsEntry', '彩色');
    await page.locator('#keywordTags button[aria-label="移除 彩色"]').click();
    assert.equal(await page.locator('#brandKeywords').inputValue(), '清爽、年轻');
    assert.equal(await page.locator('#primaryColorList .color-row').count(), 1);
    assert.equal(await page.locator('#accentColorList .color-row').count(), 1);
    await page.locator('#primaryColorList input[type="color"]').first().fill('#fff8ee');
    await page.locator('#primaryColorList input[type="text"]').first().fill('奶油白');
    await page.locator('#addPrimaryColorBtn').click();
    await page.locator('#primaryColorList input[type="color"]').nth(1).fill('#3983eb');
    await page.locator('#primaryColorList input[type="text"]').nth(1).fill('天蓝');
    for (let count = 2; count < 8; count++) await page.locator('#addPrimaryColorBtn').click();
    assert.equal(await page.locator('#primaryColorList .color-row').count(), 8);
    assert.equal(await page.locator('#addPrimaryColorBtn').isDisabled(), true);
    for (let count = 8; count > 2; count--) await page.locator('#primaryColorList .color-remove').last().click();
    await page.locator('#accentColorList input[type="color"]').first().fill('#2aaf84');
    await page.locator('#accentColorList input[type="text"]').first().fill('薄荷绿');
    await page.locator('#addAccentColorBtn').click();
    await page.locator('#accentColorList input[type="color"]').nth(1).fill('#ed6da1');
    await page.locator('#accentColorList input[type="text"]').nth(1).fill('樱花粉');
    await saved();
    const colors = await draft();
    assert.deepEqual(colors.primaryColors, [{ hex: '#fff8ee', name: '奶油白' }, { hex: '#3983eb', name: '天蓝' }]);
    assert.deepEqual(colors.accentColors, [{ hex: '#2aaf84', name: '薄荷绿' }, { hex: '#ed6da1', name: '樱花粉' }]);
    pass('20+ 风格、其他说明、关键词标签与最多八项颜色/备注');

    await step(2);
    await page.locator('#menuCount').fill('30 张');
    await page.locator('#staffCount').fill('12 位');
    await page.locator('#menuCategories').fill('推荐 / 陪玩');
    await page.locator('#contentModules').fill('热门菜单、成员和最新活动');
    await step(3);
    for (const value of ['价格计算', '数据统计']) {
      const option = page.locator(`input[name="features"][value="${value}"]`).locator('..');
      const help = option.locator('.feature-help');
      const tooltip = option.locator('.feature-tooltip');
      assert.equal(await help.getAttribute('aria-describedby'), await tooltip.getAttribute('id'));
      await help.hover();
      await page.waitForTimeout(150);
      assert.equal(await tooltip.isVisible(), true, `${value} hover 说明不可见`);
      await help.focus();
      assert.equal(await tooltip.isVisible(), true, `${value} focus 说明不可见`);
      await help.click();
      assert.equal(await tooltip.isVisible(), true, `${value} 点击说明不可见`);
      assert.equal(await option.locator('input').isChecked(), false, '帮助按钮不应勾选功能');
      await page.locator('#currentStepLabel').click();
    }
    assert.match(await page.locator('input[name="features"][value="付款页面"]').locator('..').innerText(), /不建议做/);
    await pick('features', '菜单搜索');
    await pick('features', '客服联系');
    await pick('features', '其他');
    assert.equal(await page.locator('#featureOtherField').isVisible(), true);
    await page.locator('#featureOther').fill('陪玩预约日历');
    pass('功能帮助支持 hover / focus / 点击，付款提示与其他功能');

    await step(4);
    await page.locator('#contactMethods').fill('微信 / QQ');
    await page.locator('#contactId').fill('test-contact');
    await page.locator('#serviceStart').fill('22:00');
    await page.locator('#serviceEnd').fill('02:00');
    assert.equal(await page.locator('#businessHours').inputValue(), '22:00–次日 02:00');
    await page.locator('#serviceAllDay').check();
    assert.equal(await page.locator('#businessHours').inputValue(), '24H');
    assert.equal(await page.locator('#serviceStart').isDisabled(), true);
    await page.locator('#serviceAllDay').uncheck();
    assert.equal(await page.locator('#serviceEnd').isEnabled(), true);
    assert.equal(await page.locator('#businessHours').inputValue(), '22:00–次日 02:00');
    assert.deepEqual(await page.locator('input[name="deploy"]').evaluateAll((inputs) => inputs.map((input) => input.value)), ['GITHUB 静态', '我的域名（静态）', '我的域名（动态）']);
    await pick('deploy', 'GITHUB 静态');
    await page.locator('#domain').fill('not-a-valid-url');
    await step(0);
    await page.locator('#previewBtn').click();
    assert.equal(await page.locator('#previewDialog').evaluate((dialog) => dialog.open), false);
    assert.equal(await page.locator('.step-panel[data-step="4"]').isVisible(), true);
    await focus('domain');
    await page.locator('#domain').fill('https://example.com/');
    pass('跨午夜时间、24 小时开关、三个部署选项与 URL 校验');

    const fixtures = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 240; canvas.height = 160;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff8ee'; ctx.fillRect(0, 0, 240, 160);
      ctx.fillStyle = '#3983eb'; ctx.fillRect(18, 18, 204, 48);
      ctx.fillStyle = '#2aaf84'; ctx.fillRect(18, 88, 90, 54);
      ctx.fillStyle = '#ed6da1'; ctx.fillRect(126, 88, 96, 54);
      return Object.fromEntries(['png', 'jpeg', 'webp'].map((type) => [type, canvas.toDataURL('image/' + type).split(',')[1]]));
    });
    const fixture = (name, mimeType, data) => ({ name, mimeType, buffer: Buffer.from(data, 'base64') });
    const referenceFiles = [
      fixture('参考一.png', 'image/png', fixtures.png), fixture('参考二.png', 'image/png', fixtures.png),
      fixture('参考三.jpg', 'image/jpeg', fixtures.jpeg), fixture('参考四.webp', 'image/webp', fixtures.webp),
      fixture('参考五.gif', 'image/gif', 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'),
      fixture('参考六.png', 'image/png', fixtures.png)
    ];
    await step(5);
    await pick('materials', 'LOGO');
    await page.locator('#reference').fill('https://www.bitleap.vip/');
    await page.locator('#extra').fill(longText);
    await page.locator('#referenceFiles').setInputFiles(referenceFiles);
    await page.waitForFunction(() => document.querySelectorAll('#referenceGallery .reference-card').length === 6);
    await saved();
    const storedImages = (await draft()).referenceImages;
    assert.equal(storedImages.length, 6);
    assert.ok(storedImages.every((item) => /^data:image\/(png|jpeg|webp);base64,/.test(item.src)), '参考图应保存压缩后的本地数据');
    assert.ok(storedImages.reduce((bytes, item) => bytes + item.src.length, 0) <= 1.8 * 1024 * 1024);
    await clearToast();
    await page.locator('#referenceFiles').setInputFiles(fixture('第七张.png', 'image/png', fixtures.png));
    await page.waitForFunction(() => /6|六|最多/.test(document.querySelector('#toast').textContent));
    assert.equal(await page.locator('#referenceGallery .reference-card').count(), 6);
    for (const file of referenceFiles.slice(2)) await page.locator(`#referenceGallery button[aria-label="移除参考图片 ${file.name}"]`).click();
    await clearToast();
    await page.locator('#referenceFiles').setInputFiles({ name: '损坏.png', mimeType: 'image/png', buffer: Buffer.from('not an image') });
    await page.waitForFunction(() => /失败|无效|无法|损坏/.test(document.querySelector('#toast').textContent));
    assert.equal(await page.locator('#referenceGallery .reference-card').count(), 2);
    await saved();
    assert.equal((await draft()).referenceImages.length, 2);
    assert.match(await page.locator('#summaryProgress').innerText(), /6\s*\/\s*6/);
    pass('PNG / JPEG / WebP / GIF 本地参考图、压缩持久保存、六张限制与坏图拒绝/移除');

    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('#clubName').inputValue(), '浏览器验收俱乐部');
    assert.equal(await page.locator('#gamesTags .tag-chip').count(), 2);
    assert.equal(await page.locator('#keywordTags .tag-chip').count(), 2);
    assert.equal(await page.locator('#primaryColorList .color-row').count(), 2);
    assert.equal(await page.locator('#referenceGallery .reference-card').count(), 2);
    assert.equal(await page.locator('#serviceStart').inputValue(), '22:00');
    assert.equal(await page.locator('#serviceEnd').inputValue(), '02:00');
    assert.equal(await page.locator('input[name="deploy"][value="GITHUB 静态"]').isChecked(), true);
    assert.equal(await page.locator('#extra').inputValue(), longText);
    pass('刷新后标签、其他说明、颜色、时间、部署与参考图片完整恢复');

    const backupBytes = await download('#exportDraftBtn', 'backup.json');
    const backup = JSON.parse(backupBytes.toString('utf8'));
    assert.equal(backup.data.clubName, '浏览器验收俱乐部');
    assert.equal(backup.data.referenceImages.length, 2);
    assert.equal(backup.data.primaryColors[0].name, '奶油白');
    assert.ok(backupBytes.length <= 3 * 1024 * 1024);
    await confirm(() => page.locator('#clearDraftBtn').click());
    assert.equal(await page.locator('#clubName').inputValue(), '');
    assert.equal(await page.locator('#gamesTags .tag-chip').count(), 0);
    assert.equal(await page.locator('#referenceGallery .reference-card').count(), 0);
    await confirm(() => importPayload(backupBytes));
    assert.equal(await page.locator('#clubName').inputValue(), backup.data.clubName);
    assert.equal(await page.locator('#referenceGallery .reference-card').count(), 2);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('#extra').inputValue(), longText);
    pass('包含参考图的 JSON 真实下载、确认清空、覆盖导入与持久保存');

    const legacy = {
      version: 1,
      config: { brandTitle: 'AKI CLUB WEBSITE', heroTitle: '新俱乐部 · 项目配置', heroDesc: '旧版说明', styles: ['可爱甜系', '简约现代'], features: ['菜单搜索', '客服联系'], deploy: ['GitHub Pages', '香港 Ubuntu 服务器'], materials: ['LOGO'] },
      data: { clubName: '旧版迁移俱乐部', games: '三角洲行动、王者荣耀', brandKeywords: '清爽、年轻', brandColor: '白色', accentColor: '薄荷绿', businessHours: '9:00–02:00', styles: ['简约现代'], features: ['菜单搜索'], deploy: ['GitHub Pages'], materials: ['LOGO'], domain: 'https://example.com/' }
    };
    await confirm(() => importPayload(Buffer.from(JSON.stringify(legacy))));
    assert.equal(await page.locator('#gamesTags .tag-chip').count(), 2);
    assert.equal(await page.locator('#keywordTags .tag-chip').count(), 2);
    assert.equal(await page.locator('#serviceStart').inputValue(), '09:00');
    assert.equal(await page.locator('#serviceEnd').inputValue(), '02:00');
    assert.equal(await page.locator('input[name="deploy"][value="GITHUB 静态"]').isChecked(), true);
    assert.match(await page.locator('#primaryColorList').innerText(), /白色/);
    assert.equal((await page.locator('#heroTitle').textContent()).replace(/\s/g, ''), '俱乐部网页只为你专属打造');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('#clubName').inputValue(), '旧版迁移俱乐部');
    await page.evaluate(([key, old]) => localStorage.setItem(key, JSON.stringify(old)), [DRAFT_KEY, { ...legacy.data, businessHours: '随缘在线' }]);
    await page.reload({ waitUntil: 'networkidle' });
    await step(4);
    assert.match(await page.locator('#legacyHoursNote').innerText(), /随缘在线/);
    await confirm(() => importPayload(backupBytes));
    pass('V1 备份/本机草稿的标签、旧颜色文字、GitHub 部署与时间兼容迁移');

    for (const invalid of [
      Buffer.from('{ invalid json'),
      Buffer.from(JSON.stringify({ ...backup, data: { ...backup.data, clubName: null } })),
      Buffer.from(JSON.stringify({ ...backup, data: { ...backup.data, unknown: 'bad' } })),
      Buffer.from(JSON.stringify({ ...backup, data: { ...backup.data, primaryColors: Array(9).fill({ hex: '#ffffff', name: '白' }) } })),
      Buffer.from(JSON.stringify({ ...backup, data: { ...backup.data, referenceImages: [{ name: 'evil.svg', src: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=' }] } })),
      Buffer.from(JSON.stringify({ ...backup, data: { ...backup.data, referenceImages: [{ name: 'bad.png', src: 'data:image/png;base64,bm90LWltYWdl' }] } })),
      Buffer.alloc(3 * 1024 * 1024 + 1, 32)
    ]) await rejectImport(invalid);
    pass('非法 JSON、错误字段/颜色数组/图片和超过 3 MB 备份拒绝且不覆盖');

    await page.locator('#previewBtn').click();
    await page.locator('#previewDialog').waitFor({ state: 'visible' });
    const brief = await page.locator('#previewText').innerText();
    for (const value of ['浏览器验收俱乐部', '日系文具感', '陪玩预约日历', '奶油白', '菜单搜索', 'GITHUB 静态', '次日', '参考一.png', tail]) assert.ok(brief.includes(value), `需求单缺少 ${value}`);
    const text = (await download('#textBtn', 'brief.txt')).toString('utf8').replace(/^\uFEFF/, '');
    assert.equal(text, brief);
    await page.evaluate(() => {
      window.__paintedText = [];
      window.__paintedImages = [];
      window.__pdfCrops = [];
      const render = window.AkiReceipt.render;
      window.AkiReceipt.render = async (...args) => {
        const canvas = await render(...args);
        window.__renderedBreaks = [...canvas.akiBreaks];
        return canvas;
      };
    });
    await page.locator('#imageBtn').click();
    await page.locator('#imageDialog').waitFor({ state: 'visible' });
    assert.equal(await page.locator('body').evaluate((body) => body.classList.contains('modal-open')), true, '弹窗打开时应锁定页面滚动');
    await page.waitForFunction(() => document.querySelector('#exportImage').complete && document.querySelector('#exportImage').naturalWidth > 0);
    const picture = await page.locator('#exportImage').evaluate((image) => ({ width: image.naturalWidth, height: image.naturalHeight, painted: window.__paintedText, photos: window.__paintedImages, safeBreaks: window.__renderedBreaks, pdfCrops: window.__pdfCrops }));
    assert.equal(picture.width, 1080);
    assert.ok(picture.height > 1400 && picture.height <= 18000);
    const rows = picture.painted.filter((row) => row.width === 1080 && row.height === picture.height);
    assert.ok(rows.map((row) => row.text).join('').includes('END_OF_BRIEF'), '长正文末尾未绘制');
    assert.ok(rows.every((row) => row.y >= 0 && row.y < picture.height - 10), '正文绘制超出画布');
    const png = await download('#downloadImageBtn', 'long-brief.png');
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(png.readUInt32BE(16), 1080);
    assert.equal(png.readUInt32BE(20), picture.height);
    const pdf = await download('#downloadPdfBtn', 'brief.pdf');
    assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
    const pdfSource = pdf.toString('latin1');
    const pageCount = (pdfSource.match(/\/Type\s*\/Page\b/g) || []).length;
    assert.ok(pageCount >= 2, '长清单 PDF 应真实分页');
    assert.match(pdfSource, /\/MediaBox\s*\[\s*0\s+0\s+595(?:\.\d+)?\s+841(?:\.\d+)?\s*\]/, 'PDF 应为 A4');
    assert.match(await page.locator('#pdfOpenLink').getAttribute('href'), /^blob:/);
    await page.screenshot({ path: path.join(artifacts, 'image-preview.png') });
    pass(`TXT、1080×${picture.height} PNG 与真实多页 A4 PDF 下载，长文尾句完整`);
    const photos = picture.photos.filter((photo) => photo.width === 1080 && photo.height === picture.height);
    const crops = picture.pdfCrops.filter((crop) => crop.width === 1080 && crop.height === picture.height);
    assert.equal(photos.length, backup.data.referenceImages.length, '参考图应完整绘入清单');
    assert.equal(crops.length, pageCount, '实际分页裁切数应与 PDF 页面数一致');
    assert.equal(crops[0].start, 0);
    assert.equal(crops.at(-1).end, picture.height);
    for (let index = 1; index < crops.length; index++) assert.equal(crops[index].start, crops[index - 1].end, 'PDF 页面之间不能遗漏或重复内容');
    const pageBreaks = crops.slice(0, -1).map((crop) => crop.end);
    assert.ok(pageBreaks.every((boundary) => picture.safeBreaks.includes(boundary)), 'PDF 实际裁切应采用安全断点');
    const crossings = [];
    for (const boundary of [...new Set([...picture.safeBreaks, ...pageBreaks])]) {
      for (const row of rows) if (row.text && boundary > row.top + 0.1 && boundary < row.bottom - 0.1) crossings.push({ boundary, text: row.text, top: row.top, bottom: row.bottom });
      for (const photo of photos) if (boundary > photo.top && boundary < photo.bottom) crossings.push({ boundary, photo });
    }
    assert.deepEqual(crossings, [], 'PDF 分页不能穿过实际文字字形或参考图片');
    await fs.writeFile(path.join(artifacts, 'safe-break-check.json'), JSON.stringify({ pageCount, pageBreaks, breakCount: picture.safeBreaks.length, glyphCount: rows.length, photoCount: photos.length, crossings }, null, 2));
    pass(`真实 ${pageCount} 页 PDF 的分页连续，所有断点均避开字形与参考图片`);

    await page.evaluate(() => {
      window.__shareCalls = [];
      Object.defineProperty(navigator, 'canShare', { configurable: true, value: ({ files }) => files?.length === 1 && files[0] instanceof File });
      Object.defineProperty(navigator, 'share', { configurable: true, value: async (data) => {
        window.__shareCalls.push({ title: data.title, text: data.text, files: await Promise.all(data.files.map(async (file) => ({ name: file.name, type: file.type, size: file.size, realFile: file instanceof File, head: Array.from(new Uint8Array(await file.arrayBuffer()).slice(0, 5)) }))) });
      } });
    });
    await page.locator('#shareImageBtn').click();
    await page.locator('#sharePdfBtn').click();
    await page.waitForFunction(() => window.__shareCalls.length === 2);
    const shares = await page.evaluate(() => window.__shareCalls);
    assert.equal(shares[0].files[0].type, 'image/png');
    assert.equal(shares[1].files[0].type, 'application/pdf');
    assert.ok(shares.every((call) => call.files[0].realFile && call.files[0].size > 100));
    assert.equal(Buffer.from(shares[1].files[0].head).toString(), '%PDF-');
    await clearToast();
    await page.evaluate(() => Object.defineProperty(navigator, 'share', { configurable: true, value: async () => { throw new DOMException('Cancelled', 'AbortError'); } }));
    await page.locator('#shareImageBtn').click();
    await page.waitForTimeout(150);
    assert.equal((await page.locator('#toast').textContent()).length, 0, '用户取消分享不应误报失败或成功');
    await page.evaluate(() => Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => false }));
    await page.locator('#shareImageBtn').click();
    assert.match(await page.locator('#toast').innerText(), /长按|下载|不支持/);
    assert.equal(await page.locator('#exportImage').evaluate((image) => image.naturalWidth), 1080);
    const fallbackPdf = await download('#sharePdfBtn', 'fallback-share.pdf');
    assert.equal(fallbackPdf.subarray(0, 5).toString(), '%PDF-');
    assert.equal((await page.locator('#toast').textContent()).includes('已发送给'), false);
    pass('系统分享传入真实 PNG/PDF File、取消静默与不支持时保存回退');

    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#previewDialog').evaluate((dialog) => dialog.open), true);
    assert.equal(await page.locator('body').evaluate((body) => body.classList.contains('modal-open')), true, '底层预览仍打开时应保持滚动锁定');
    await focus('imageBtn');
    await page.keyboard.press('Escape');
    await focus('previewBtn');
    await page.waitForFunction(() => !document.body.classList.contains('modal-open'));
    assert.equal(await page.locator('body').evaluate((body) => body.classList.contains('modal-open')), false, '全部弹窗关闭后应解除滚动锁定');
    pass('Esc 逐层关闭导出预览并返回触发按钮');

    const weChatContext = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 MicroMessenger/8.0.50' });
    weChatContext.on('request', observeRequest);
    const weChatPage = await weChatContext.newPage();
    weChatPage.on('pageerror', (error) => errors.push(error.message));
    await weChatPage.goto(URL, { waitUntil: 'networkidle' });
    await weChatPage.locator('#clubName').fill('微信保存测试');
    await weChatPage.locator('#previewBtn').click();
    await weChatPage.locator('#imageBtn').click();
    await weChatPage.locator('#imageDialog').waitFor({ state: 'visible' });
    await weChatPage.waitForFunction(() => document.querySelector('#exportImage').naturalWidth === 1080);
    assert.match(await weChatPage.locator('#imageHint').innerText(), /长按/);
    let imageDownloads = 0;
    weChatPage.on('download', () => { imageDownloads++; });
    await weChatPage.locator('#downloadImageBtn').click();
    await weChatPage.waitForTimeout(150);
    assert.equal(imageDownloads, 0, '微信图片应提示长按，而非强制下载');
    assert.match(await weChatPage.locator('#toast').innerText(), /长按/);
    const weChatPdf = await download('#downloadPdfBtn', 'wechat-brief.pdf', weChatPage);
    assert.equal(weChatPdf.subarray(0, 5).toString(), '%PDF-');
    await weChatContext.close();
    pass('微信 UA 使用真实图片长按提示，PDF 仍可实际保存');

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
    await confirm(() => importPayload(backupBytes));
    pass('超出画布长度明确拒绝，按钮恢复并保留文字需求');

    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: width >= 768 ? 1000 : 844 });
      for (let index = 0; index < 6; index++) {
        await step(index);
        const size = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: innerWidth }));
        assert.ok(size.scroll <= size.viewport + 1, `${width}px 第 ${index + 1} 步横向溢出 ${size.scroll}`);
        if (width === 390 && index === 5) await page.screenshot({ path: path.join(artifacts, 'mobile-references.png'), fullPage: true });
      }
      await step(0);
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
      if (width === 390 || width === 1440) await page.screenshot({ path: path.join(artifacts, width === 390 ? 'mobile.png' : 'desktop.png'), fullPage: true });
    }
    pass('320 / 390 / 768 / 1440 宽度六个步骤均无页面横向溢出');
    assert.deepEqual(outbound, [], '参考图片处理或导出产生了上传/外部网络请求');
    pass('参考图片处理与导出没有上传或外部网络请求');
    assert.deepEqual(errors, [], '浏览器出现未处理的脚本错误');
    await fs.writeFile(path.join(artifacts, 'results.json'), JSON.stringify({ checks, errors, outbound, image: { width: picture.width, height: picture.height }, pdfBytes: pdf.length, pageCount, pageBreaks, crossings }, null, 2));
    console.log(`\n${checks} checks passed. Screenshots and downloads: ${artifacts}`);
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
