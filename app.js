(() => {
  'use strict';

  const CONFIG_KEY = 'aki_club_brief_template_v1';
  const DRAFT_KEY = 'aki_club_brief_draft_v1';
  const DEFAULT = {
    brandTitle: 'AKI CLUB WEBSITE',
    heroTitle: '你的俱乐部，\n从这里开始。',
    heroDesc: '把品牌、内容和想要的功能整理清楚。\n六个小步骤，生成一份可以直接沟通的建站需求。',
    styles: ['可爱甜系', 'INS 高级感', '硬核电竞', '简约现代', '卡通 3D', '毛玻璃', '清新明亮', '暗黑科技'],
    features: ['菜单展示', '菜单搜索', '分类筛选', '手机底部导航', '客服联系', '陪玩展示', '互动玩法', '点单夹', '价格计算', '下单表单', '付款页面', '活动专区', '真实好评', '后台管理', '数据统计'],
    deploy: ['GitHub Pages', '香港 Ubuntu 服务器', '中国大陆服务器', 'Netlify', 'Cloudflare Pages', '待确认'],
    materials: ['LOGO', '品牌人物 / 吉祥物', '菜单海报', '客服二维码', '付款码', '俱乐部介绍文案', '下单须知', '老板权益 / 赔付规则']
  };
  const FIELD_LIMITS = {
    clubName: 100, clubEnglish: 100, games: 500, audience: 500,
    brandColor: 120, accentColor: 120, brandKeywords: 500,
    menuCount: 100, staffCount: 100, menuCategories: 1000, contentModules: 5000,
    contactMethods: 500, contactId: 200, businessHours: 200, domain: 2000,
    reference: 5000, extra: 5000
  };
  const OPTION_KEYS = ['styles', 'features', 'deploy', 'materials'];
  const CONFIG_LIMITS = { brandTitle: 120, heroTitle: 120, heroDesc: 1000 };
  const STEP_LABELS = ['基础资料', '视觉方向', '内容结构', '网站功能', '联系与部署', '参考与素材'];
  const STEP_FIELDS = [
    ['clubName'], ['brandColor', 'accentColor', 'brandKeywords'],
    ['menuCount', 'staffCount', 'menuCategories', 'contentModules'], [],
    ['contactMethods', 'contactId', 'businessHours', 'domain'], ['reference', 'extra']
  ];
  const STEP_OPTIONS = [null, 'styles', null, 'features', 'deploy', 'materials'];
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const form = $('#briefForm');
  let currentStep = 0;
  let config = freshDefault();
  let saveTimer;
  let toastTimer;
  let imageURL;
  let imageBlob;
  let storageReadError = false;

  function freshDefault() {
    return { ...DEFAULT, ...Object.fromEntries(OPTION_KEYS.map((key) => [key, [...DEFAULT[key]]])) };
  }

  function plainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function cleanConfig(source, strict = false) {
    if (!plainObject(source)) throw new Error('模板格式不正确');
    const allowed = [...Object.keys(CONFIG_LIMITS), ...OPTION_KEYS];
    if (strict && Object.keys(source).some((key) => !allowed.includes(key))) throw new Error('模板含有不支持的字段');
    const result = freshDefault();
    for (const [key, limit] of Object.entries(CONFIG_LIMITS)) {
      if (!(key in source)) continue;
      if (typeof source[key] !== 'string' || source[key].length > limit) {
        if (strict) throw new Error('模板文字格式或长度不正确');
        continue;
      }
      result[key] = source[key].trim() || DEFAULT[key];
    }
    for (const key of OPTION_KEYS) {
      if (!(key in source)) continue;
      const items = source[key];
      if (!Array.isArray(items) || !items.length || items.length > 80 || items.some((item) => typeof item !== 'string' || !item.trim() || item.length > 120 || /[\r\n]/.test(item))) {
        if (strict) throw new Error('每组选项需有 1–80 项，每项不超过 120 字且独占一行');
        continue;
      }
      result[key] = [...new Set(items.map((item) => item.trim()))];
    }
    return result;
  }

  function cleanData(source, strict = false, choices = config) {
    if (!plainObject(source)) throw new Error('项目数据格式不正确');
    const allowed = [...Object.keys(FIELD_LIMITS), ...OPTION_KEYS];
    if (strict && Object.keys(source).some((key) => !allowed.includes(key))) throw new Error('项目数据含有不支持的字段');
    const result = {};
    for (const [key, limit] of Object.entries(FIELD_LIMITS)) {
      const value = Object.hasOwn(source, key) ? source[key] : '';
      if (typeof value !== 'string' || value.length > limit) {
        if (strict) throw new Error('项目文字格式或长度不正确');
        result[key] = typeof value === 'string' ? value : '';
      } else result[key] = value;
    }
    for (const key of OPTION_KEYS) {
      const values = Object.hasOwn(source, key) ? source[key] : [];
      if (!Array.isArray(values) || values.length > (key === 'deploy' ? 1 : 80) || values.some((value) => typeof value !== 'string' || value.length > 120)) {
        if (strict) throw new Error('勾选数据格式不正确');
        result[key] = [];
        continue;
      }
      if (strict && values.some((value) => !choices[key].includes(value))) throw new Error('勾选项与备份中的模板不一致');
      result[key] = [...new Set(values.filter((value) => choices[key].includes(value)))];
    }
    return result;
  }

  function readStored(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      storageReadError = true;
      return null;
    }
  }

  function selected(name) {
    return $$(`input[name="${name}"]:checked`).map((input) => input.value);
  }

  function value(id) {
    return document.getElementById(id).value.trim();
  }

  function formData() {
    return {
      ...Object.fromEntries(Object.keys(FIELD_LIMITS).map((key) => [key, document.getElementById(key).value])),
      ...Object.fromEntries(OPTION_KEYS.map((key) => [key, selected(key)]))
    };
  }

  function applyData(data) {
    for (const key of Object.keys(FIELD_LIMITS)) {
      const input = document.getElementById(key);
      input.value = data[key] || '';
      input.setCustomValidity('');
    }
    for (const key of OPTION_KEYS) {
      $$(`input[name="${key}"]`).forEach((input) => { input.checked = (data[key] || []).includes(input.value); });
    }
    updateSummary();
  }

  function renderTemplate() {
    const containers = { styles: '#styleChoices', features: '#featureChoices', deploy: '#deployChoices', materials: '#materialChoices' };
    for (const key of OPTION_KEYS) {
      const fragment = document.createDocumentFragment();
      for (const item of config[key]) {
        const label = document.createElement('label');
        label.className = 'choice';
        const input = document.createElement('input');
        input.type = key === 'deploy' ? 'radio' : 'checkbox';
        input.name = key;
        input.value = item;
        const check = document.createElement('span');
        check.className = 'check';
        check.setAttribute('aria-hidden', 'true');
        const text = document.createElement('span');
        text.textContent = item;
        label.append(input, check, text);
        fragment.append(label);
      }
      $(containers[key]).replaceChildren(fragment);
    }
    $('#brandTitle').textContent = config.brandTitle;
    $('#brandMark').textContent = Array.from(config.brandTitle.trim())[0]?.toUpperCase() || 'A';
    $('#heroTitle').textContent = config.heroTitle;
    $('#heroDesc').textContent = config.heroDesc;
    $('#footerBrand').textContent = config.brandTitle + ' · PROJECT BRIEF';
    document.title = config.brandTitle + ' · 建站需求收集';
  }

  function completedSteps() {
    return STEP_FIELDS.map((fields, step) => fields.some((key) => value(key)) || (STEP_OPTIONS[step] !== null && selected(STEP_OPTIONS[step]).length > 0));
  }

  function updateSummary() {
    $('#summaryName').textContent = value('clubName') || '新主场，正在酝酿。';
    $('#summaryGames').textContent = value('games') || '待填写';
    $('#summaryStyle').textContent = selected('styles').join('、') || value('brandKeywords') || '待选择';
    const features = selected('features');
    $('#summaryFeatures').textContent = features.length ? `${features.length} 项 · ${features.slice(0, 2).join('、')}${features.length > 2 ? ' 等' : ''}` : '待选择';
    $('#summaryDeploy').textContent = selected('deploy')[0] || '待确认';
    const complete = completedSteps();
    const count = complete.filter(Boolean).length;
    $('#progressBar').value = count;
    $('#progressCount').textContent = `${count} / 6`;
    $('#summaryProgress').textContent = `${count} / 6`;
    $$('.step-link').forEach((button) => {
      const step = Number(button.dataset.step);
      button.classList.toggle('done', complete[step]);
      const state = button.querySelector('.step-state');
      if (state) state.textContent = complete[step] ? '已填写' : '待填写';
    });
  }

  function goStep(step, focus = false) {
    currentStep = Math.max(0, Math.min(5, step));
    $$('.step-panel').forEach((panel) => {
      const active = Number(panel.dataset.step) === currentStep;
      panel.hidden = !active;
      panel.classList.toggle('active', active);
    });
    $$('.step-link').forEach((button) => {
      const active = Number(button.dataset.step) === currentStep;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    $('#stepPosition').textContent = `${String(currentStep + 1).padStart(2, '0')} / 06`;
    $('#currentStepLabel').textContent = STEP_LABELS[currentStep];
    $('#prevBtn').disabled = currentStep === 0;
    $('#nextLabel').textContent = currentStep === 5 ? '生成需求单' : '下一步';
    if (focus) {
      const heading = $(`.step-panel[data-step="${currentStep}"] h3`);
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
      form.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  }

  function saveStatus(text, state) {
    $('#saveStatus').textContent = text;
    $('#saveStatus').dataset.state = state;
  }

  function saveDraft(showMessage = false) {
    clearTimeout(saveTimer);
    saveTimer = null;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData()));
      saveStatus('已保存到当前浏览器', 'saved');
      if (showMessage) toast('草稿已保存在当前浏览器');
      return true;
    } catch {
      saveStatus('保存失败，请导出备份', 'error');
      if (showMessage) toast('浏览器无法保存，请导出备份以保留填写内容');
      return false;
    }
  }

  function scheduleSave() {
    updateSummary();
    saveStatus('正在保存…', 'pending');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveDraft(), 500);
  }

  function toast(message) {
    const element = $('#toast');
    element.textContent = message;
    element.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => element.classList.remove('show'), 3200);
  }

  function validateForExport() {
    const name = $('#clubName');
    const domain = $('#domain');
    name.setCustomValidity(value('clubName') ? '' : '请先填写俱乐部名称');
    domain.setCustomValidity('');
    if (value('domain')) {
      try {
        const url = new URL(value('domain'));
        if (!['https:', 'http:'].includes(url.protocol)) throw new Error();
      } catch {
        domain.setCustomValidity('请填写完整网址，例如 https://example.com');
      }
    }
    for (const [input, step] of [[name, 0], [domain, 4]]) {
      if (!input.checkValidity()) {
        goStep(step, true);
        input.reportValidity();
        input.focus();
        toast(input === name ? '先填写俱乐部名称，就可以生成需求单' : '请检查域名 / 已有网站的网址');
        return false;
      }
    }
    return true;
  }

  function brief() {
    const field = (label, key) => `${label}：${value(key) || '待补充'}`;
    const list = (key) => selected(key).map((item) => '✓ ' + item).join('\n') || '待确认';
    return [
      `【电竞俱乐部建站 · 项目需求单】\n${config.brandTitle}`,
      `【01 · 俱乐部基础资料】\n${field('俱乐部名称', 'clubName')}\n${field('英文名称', 'clubEnglish')}\n${field('主营游戏', 'games')}\n${field('目标用户 / 主要客户群', 'audience')}`,
      `【02 · 品牌风格与颜色】\n品牌风格：${selected('styles').join(' / ') || '待确认'}\n${field('品牌主色', 'brandColor')}\n${field('辅助色', 'accentColor')}\n${field('品牌关键词', 'brandKeywords')}`,
      `【03 · 菜单与内容结构】\n${field('菜单数量', 'menuCount')}\n${field('陪玩 / 人员数量', 'staffCount')}\n${field('菜单分类', 'menuCategories')}\n${field('首页重点内容', 'contentModules')}`,
      `【04 · 需要的网站功能】\n${list('features')}`,
      `【05 · 客服与部署】\n${field('客服渠道', 'contactMethods')}\n${field('主要客服号', 'contactId')}\n${field('客服时间', 'businessHours')}\n部署方式：${selected('deploy')[0] || '待确认'}\n${field('域名 / 已有网站', 'domain')}`,
      `【06 · 参考与素材】\n已准备素材：\n${list('materials')}\n\n${field('参考网站 / 图片', 'reference')}\n${field('其他要求', 'extra')}`,
      '【沟通建议】\n• 优先考虑手机端使用体验与微信内浏览习惯\n• 建议重要信息不依赖鼠标悬浮展示，桌面端独立适配\n• 可进一步沟通菜单搜索、分类与客服入口的安排\n• 最终价格、菜单、赔付规则与联系方式以俱乐部真实资料为准\n\n说明：以上为沟通建议，未填写的内容与未选择的功能仍待确认。具体交付范围以最终确认的需求为准。'
    ].join('\n\n');
  }

  function openDialog(dialog) {
    if (!dialog.open) dialog.showModal();
  }

  function showPreview() {
    if (!validateForExport()) return;
    saveDraft();
    $('#previewText').textContent = brief();
    openDialog($('#previewDialog'));
  }

  async function copyBrief() {
    if (!validateForExport()) return;
    saveDraft();
    const text = brief();
    let copied = false;
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch {
      const active = document.activeElement;
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.cssText = 'position:fixed;left:-9999px;top:0;';
      const dialogs = $$('dialog[open]');
      (dialogs.at(-1) || document.body).append(textarea);
      textarea.select();
      try { copied = document.execCommand('copy'); } catch { /* Use the visible preview when copying is unavailable. */ }
      textarea.remove();
      active?.focus();
    }
    if (copied) toast('已复制需求单，可粘贴发送');
    else {
      showPreview();
      toast('复制未成功，请在预览中长按选择并复制文字');
    }
  }

  function filename(extension) {
    const name = Array.from(value('clubName') || '新俱乐部').slice(0, 60).join('').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').replace(/[. ]+$/, '') || '新俱乐部';
    return name + '-建站需求单.' + extension;
  }

  function downloadURL(url, name) {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
  }

  function downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    downloadURL(url, name);
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  function downloadText() {
    if (!validateForExport()) return;
    saveDraft();
    downloadBlob(new Blob(['\ufeff', brief()], { type: 'text/plain;charset=utf-8' }), filename('txt'));
    toast('已发起下载文字需求单');
  }

  function settingsToForm() {
    $('#setBrandTitle').value = config.brandTitle;
    $('#setHeroTitle').value = config.heroTitle;
    $('#setHeroDesc').value = config.heroDesc;
    for (const key of OPTION_KEYS) $('#set' + key[0].toUpperCase() + key.slice(1)).value = config[key].join('\n');
  }

  function updateTemplate(next) {
    const current = formData();
    try { localStorage.setItem(CONFIG_KEY, JSON.stringify(next)); }
    catch {
      toast('模板保存失败，设置未应用。请检查浏览器存储权限');
      return false;
    }
    config = next;
    renderTemplate();
    applyData(cleanData(current));
    // Save the filtered selection too, so removed options cannot reappear in a later draft.
    const saved = saveDraft();
    toast(saved ? '模板已保存，当前项目内容已保留' : '模板已保存；草稿保存失败，请导出备份');
    return true;
  }

  function saveTemplate() {
    const candidate = {
      brandTitle: $('#setBrandTitle').value.trim() || DEFAULT.brandTitle,
      heroTitle: $('#setHeroTitle').value.trim() || DEFAULT.heroTitle,
      heroDesc: $('#setHeroDesc').value.trim() || DEFAULT.heroDesc
    };
    for (const key of OPTION_KEYS) {
      const text = $('#set' + key[0].toUpperCase() + key.slice(1)).value;
      const items = text.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
      candidate[key] = items.length ? items : DEFAULT[key];
    }
    try {
      if (updateTemplate(cleanConfig(candidate, true))) $('#settingsDialog').close();
    } catch (error) { toast(error.message); }
  }

  function exportDraft() {
    clearTimeout(saveTimer);
    saveDraft();
    const backup = { version: 1, exportedAt: new Date().toISOString(), config, data: formData() };
    downloadBlob(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' }), filename('json'));
    toast('已导出当前浏览器的项目与模板备份');
  }

  async function importDraft(event) {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 500 * 1024) { toast('备份文件不能超过 500 KB'); return; }
    let nextConfig;
    let nextData;
    try {
      const parsed = JSON.parse((await file.text()).replace(/^\ufeff/, ''));
      const allowed = ['version', 'exportedAt', 'config', 'data'];
      if (!plainObject(parsed) || Object.keys(parsed).some((key) => !allowed.includes(key)) || (parsed.version !== undefined && parsed.version !== 1) || (parsed.exportedAt !== undefined && typeof parsed.exportedAt !== 'string')) throw new Error('不是支持的项目备份文件');
      nextConfig = cleanConfig(parsed.config, true);
      nextData = cleanData(parsed.data, true, nextConfig);
    } catch (error) {
      toast(error instanceof SyntaxError ? '文件不是有效的 JSON 备份' : error.message);
      return;
    }
    if (!confirm('导入会覆盖当前浏览器中的项目草稿与模板设置。确认继续？')) return;
    clearTimeout(saveTimer);
    let previousConfig;
    let previousDraft;
    try {
      previousConfig = localStorage.getItem(CONFIG_KEY);
      previousDraft = localStorage.getItem(DRAFT_KEY);
      localStorage.setItem(CONFIG_KEY, JSON.stringify(nextConfig));
      localStorage.setItem(DRAFT_KEY, JSON.stringify(nextData));
    } catch {
      // Restore both original keys if only one of the two writes succeeded.
      if (previousConfig !== undefined && previousDraft !== undefined) {
        try {
          for (const [key, old] of [[CONFIG_KEY, previousConfig], [DRAFT_KEY, previousDraft]]) {
            if (old === null) localStorage.removeItem(key);
            else localStorage.setItem(key, old);
          }
        } catch { /* The backup file still contains the attempted import. */ }
      }
      saveStatus('导入保存失败，请保留备份文件', 'error');
      toast('导入未完成：浏览器无法保存，请保留备份文件后再试');
      return;
    }
    config = nextConfig;
    renderTemplate();
    applyData(nextData);
    goStep(0, true);
    saveStatus('已保存到当前浏览器', 'saved');
    toast('备份已导入并保存到当前浏览器');
  }

  function wrapText(context, text, width) {
    const lines = [];
    for (const paragraph of text.split('\n')) {
      if (!paragraph) { lines.push(''); continue; }
      let line = '';
      for (const character of paragraph) {
        if (line && context.measureText(line + character).width > width) {
          lines.push(line);
          line = character;
        } else line += character;
      }
      lines.push(line);
    }
    return lines;
  }

  async function exportImage() {
    if (!validateForExport()) return;
    saveDraft();
    const button = $('#imageBtn');
    const previousLabel = button.textContent;
    button.disabled = true;
    button.textContent = '正在生成…';
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      const text = brief();
      if (text.length > 60000) throw new Error('内容过长，无法生成单张长图。请下载文字需求单，或缩短内容后重试');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('当前浏览器无法生成长图，请下载文字需求单');
      const width = 1080;
      const side = 86;
      const contentWidth = width - side * 2;
      const family = '"PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
      const rows = [];
      let y = 104;
      const addRows = (text, font, color, lineHeight) => {
        context.font = font;
        for (const line of wrapText(context, text, contentWidth)) {
          rows.push({ text: line, font, color, y });
          y += lineHeight;
        }
      };
      addRows(config.brandTitle, `800 34px ${family}`, '#182735', 47);
      y += 12;
      addRows('电竞俱乐部建站需求单 · PROJECT BRIEF', `500 23px ${family}`, '#6b7785', 36);
      y += 44;
      for (const paragraph of text.split('\n')) {
        if (!paragraph) { y += 22; continue; }
        const heading = paragraph.startsWith('【') && paragraph.endsWith('】');
        if (heading) y += 15;
        addRows(paragraph, `${heading ? '700 30' : '400 26'}px ${family}`, heading ? '#214e75' : paragraph.startsWith('✓') ? '#287a60' : '#293744', heading ? 45 : 42);
        if (heading) y += 10;
      }
      y += 45;
      addRows('Generated by ' + config.brandTitle, `400 20px ${family}`, '#85909a', 29);
      const height = Math.max(1100, Math.ceil(y + 52));
      // Keep the canvas below mobile browser limits; reject excess instead of cropping it.
      if (height > 14000) throw new Error('内容过长，无法生成单张长图。请下载文字需求单，或缩短内容后重试');
      canvas.width = width;
      canvas.height = height;
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
      const colors = ['#3983eb', '#2aaf84', '#f6a24b', '#ed6da1'];
      colors.forEach((color, index) => {
        context.fillStyle = color;
        context.fillRect(side + index * contentWidth / 4, 36, contentWidth / 4, 8);
      });
      for (const row of rows) {
        context.font = row.font;
        context.fillStyle = row.color;
        context.fillText(row.text, side, row.y);
      }
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('长图生成失败，请下载文字需求单');
      if (imageURL) URL.revokeObjectURL(imageURL);
      imageBlob = blob;
      imageURL = URL.createObjectURL(blob);
      $('#exportImage').src = imageURL;
      $('#exportImage').alt = value('clubName') + ' · 完整建站需求长图';
      const weChat = /MicroMessenger/i.test(navigator.userAgent);
      $('#imageHint').textContent = weChat ? '微信内请长按图片，选择保存图片。内容过长时也可下载文字需求单。' : '图片宽度为 1080 px，白底彩色点缀。可点击下载，手机也可长按图片保存。';
      $('#downloadImageBtn').textContent = weChat ? '长按图片保存' : '下载 PNG 长图';
      // Restore the trigger before showModal so closing the nested dialog returns focus to it.
      button.disabled = false;
      button.textContent = previousLabel;
      button.focus();
      openDialog($('#imageDialog'));
      toast('长图已生成，可以预览并保存');
    } catch (error) { toast(error.message || '长图生成失败，请下载文字需求单'); }
    finally {
      button.disabled = false;
      button.textContent = previousLabel;
    }
  }

  const storedConfig = readStored(CONFIG_KEY);
  if (storedConfig) {
    try { config = cleanConfig(storedConfig); }
    catch { storageReadError = true; }
  }
  renderTemplate();
  const storedDraft = readStored(DRAFT_KEY);
  if (storedDraft) {
    try {
      applyData(cleanData(storedDraft));
      saveStatus('已恢复当前浏览器的草稿', 'saved');
    } catch { storageReadError = true; }
  }
  if (storageReadError) saveStatus('本机数据读取失败，请保留原备份', 'error');
  else if (!storedDraft) saveStatus('填写后自动保存在当前浏览器', 'empty');
  updateSummary();
  goStep(0);
  form.noValidate = true;
  form.addEventListener('submit', (event) => { event.preventDefault(); showPreview(); });
  form.addEventListener('input', (event) => {
    if (event.target.matches('input, textarea')) event.target.setCustomValidity('');
    scheduleSave();
  });
  form.addEventListener('change', scheduleSave);
  window.addEventListener('pagehide', () => { if (saveTimer) saveDraft(); });
  $$('.step-link').forEach((button) => button.addEventListener('click', () => goStep(Number(button.dataset.step), true)));
  $('#prevBtn').addEventListener('click', () => goStep(currentStep - 1, true));
  $('#nextBtn').addEventListener('click', () => currentStep === 5 ? showPreview() : goStep(currentStep + 1, true));
  $('#saveBtn').addEventListener('click', () => saveDraft(true));
  $('#previewBtn').addEventListener('click', showPreview);
  $('#copyBtn').addEventListener('click', copyBrief);
  $('#sheetCopyBtn').addEventListener('click', copyBrief);
  $('#textBtn').addEventListener('click', downloadText);
  $('#imageBtn').addEventListener('click', exportImage);
  $('#downloadImageBtn').addEventListener('click', () => {
    if (!imageBlob || !imageURL) return;
    if (/MicroMessenger/i.test(navigator.userAgent)) toast('请长按上方图片，选择保存到手机');
    else { downloadURL(imageURL, filename('png')); toast('已发起下载 PNG 长图'); }
  });
  $('#settingsBtn').addEventListener('click', () => { settingsToForm(); openDialog($('#settingsDialog')); });
  $('#saveTemplateBtn').addEventListener('click', saveTemplate);
  $('#resetTemplateBtn').addEventListener('click', () => {
    if (!confirm('恢复默认模板？当前填写的项目内容会保留，已移除的自定义选项不再勾选。')) return;
    if (updateTemplate(freshDefault())) settingsToForm();
  });
  $('#exportDraftBtn').addEventListener('click', exportDraft);
  $('#importDraftBtn').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', importDraft);
  $('#clearDraftBtn').addEventListener('click', () => {
    if (!confirm('清空当前项目填写内容？模板设置会保留。可先导出备份。')) return;
    clearTimeout(saveTimer);
    applyData(cleanData({}));
    goStep(0, true);
    const saved = saveDraft();
    toast(saved ? '项目草稿已清空，模板设置已保留' : '当前页面已清空，但保存失败；重新打开仍可能恢复旧草稿');
  });
  $$('[data-close]').forEach((button) => button.addEventListener('click', () => button.closest('dialog')?.close()));
  $$('dialog').forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
  });
})();
