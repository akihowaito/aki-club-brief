(() => {
  'use strict';

  const CONFIG_KEY = 'aki_club_brief_template_v1';
  const DRAFT_KEY = 'aki_club_brief_draft_v1';
  const OLD_STYLES = ['可爱甜系', 'INS 高级感', '硬核电竞', '简约现代', '卡通 3D', '毛玻璃', '清新明亮', '暗黑科技'];
  const IMAGE_LIMIT = 1800000;
  const PROJECT_TYPES = {
    club: {
      label: '俱乐部网页', nameLabel: '俱乐部名称', gameLabel: '主营游戏',
      contentLabels: ['菜单数量', '陪玩 / 人员数量', '菜单分类', '首页重点内容'],
      basicHeading: '先认识一下你的俱乐部', basicDesc: '品牌名称是起点，其他资料可以慢慢补充。',
      contentHeading: '把你想展示的内容列出来', contentDesc: '菜单、成员、活动，都可以成为网站的一部分。',
      placeholders: ['例如：AKI 电竞', '例如：30 张 / 暂时还没统计', '例如：12 位；没有可以留空', '例如：推荐 / 趣味 / 护航 / 陪玩', '例如：热门推荐、老板权益、最新活动、陪玩成员、真实好评、付款方式…']
    },
    event: {
      label: '俱乐部活动网页', nameLabel: '活动 / 项目名称', gameLabel: '关联游戏',
      contentLabels: ['活动时间', '参与人数 / 名额', '活动类型', '活动内容与规则'],
      basicHeading: '先认识一下你的活动', basicDesc: '写下活动名称、关联游戏与参与人群。',
      contentHeading: '把活动安排和规则列出来', contentDesc: '时间、名额、活动内容和参与规则，都可以写在这里。',
      placeholders: ['例如：AKI 周年庆活动', '例如：10 月 1 日至 10 月 7 日', '例如：限 100 人 / 不限名额', '例如：周年庆 / 节日活动 / 比赛 / 报名', '例如：活动介绍、参与条件、活动流程、奖励与领取规则…']
    },
    interactive: {
      label: '互动玩法网页', nameLabel: '玩法 / 项目名称', gameLabel: '适用游戏',
      contentLabels: ['玩法数量', '参与人数', '互动玩法类型', '玩法流程与规则'],
      basicHeading: '先认识一下你的玩法', basicDesc: '给玩法一个名字，再写下适用游戏与参与人群。',
      contentHeading: '把玩法流程和规则列出来', contentDesc: '写清楚如何参与、如何获得结果，以及有哪些限制。',
      placeholders: ['例如：AKI 幸运转盘', '例如：1 个转盘 + 1 个刮刮卡', '例如：每人参与 / 多人同场 / 不限人数', '例如：抽奖 / 转盘 / 刮刮卡 / 骰子 / 小游戏', '例如：参与入口、次数限制、奖项、抽取流程、结果展示与兑换规则…']
    },
    other: {
      label: '定制其他', nameLabel: '项目名称', gameLabel: '相关游戏',
      contentLabels: ['预计页面数量', '主要使用人数', '页面 / 内容分类', '你想实现什么'],
      basicHeading: '先认识一下你的项目', basicDesc: '写下项目名称和主要用户，其他想法可以慢慢补充。',
      contentHeading: '把你想实现的内容列出来', contentDesc: '页面、使用人数和想解决的问题，都可以写在这里。',
      placeholders: ['例如：会员展示页 / 品牌介绍页', '例如：1 个首页 + 3 个内容页', '例如：小范围内部使用 / 面向所有访客', '例如：首页 / 关于我们 / 产品 / 联系方式', '描述你的想法、使用场景，以及希望用户在网页里完成什么…']
    }
  };
  const DEFAULT = {
    brandTitle: '定制化网页',
    heroTitle: '你的想法\n只为你专属打造',
    heroDesc: '把品牌、内容和想要的功能整理清楚。\n六个小步骤，生成一份可以直接沟通的建站需求。',
    styles: [...OLD_STYLES, '奶油温柔', '极简留白', '日系清透', '韩系少女', '复古像素', '潮流街头', '杂志排版', '手绘涂鸦', '赛博未来', '运动活力', '自然治愈', '精致轻奢', '国潮东方', '黑白极简', '彩虹渐变', '其他'],
    features: ['菜单展示', '菜单搜索', '分类筛选', '手机底部导航', '客服联系', '陪玩展示', '互动玩法', '点单夹', '价格计算', '下单表单', '付款页面', '活动专区', '真实好评', '后台管理', '数据统计', '其他'],
    deploy: ['GITHUB 静态', '我的域名（静态）', '我的域名（动态）'],
    materials: ['LOGO', '品牌人物 / 吉祥物', '菜单海报', '客服二维码', '付款码', '俱乐部介绍文案', '下单须知', '老板权益 / 赔付规则']
  };
  const FIELD_LIMITS = {
    clubName: 100, clubEnglish: 100, games: 500, audience: 500,
    brandColor: 120, accentColor: 120, brandKeywords: 500, styleOther: 1000, featureOther: 2000,
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
  let projectType = 'club';
  let config = freshDefault();
  let saveTimer;
  let toastTimer;
  let imageURL;
  let imageBlob;
  let pdfURL;
  let pdfBlob;
  let storageReadError = false;
  const tagValues = { games: [], brandKeywords: [] };
  const colorValues = { primaryColors: [], accentColors: [] };
  let referenceImages = [];
  let readingImages = false;
  let referenceGeneration = 0;

  function freshDefault() {
    return { ...DEFAULT, ...Object.fromEntries(OPTION_KEYS.map((key) => [key, [...DEFAULT[key]]])) };
  }

  function plainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function cleanConfig(source, strict = false) {
    if (!plainObject(source)) throw new Error('备份格式不正确');
    const allowed = [...Object.keys(CONFIG_LIMITS), ...OPTION_KEYS];
    if (strict && Object.keys(source).some((key) => !allowed.includes(key))) throw new Error('备份含有不支持的字段');
    const result = freshDefault();
    for (const [key, limit] of Object.entries(CONFIG_LIMITS)) {
      if (!(key in source)) continue;
      if (typeof source[key] !== 'string' || source[key].length > limit) {
        if (strict) throw new Error('备份文字格式或长度不正确');
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
      result[key] = [...new Set(items.map((item) => key === 'features' ? featureName(item.trim()) : item.trim()))];
    }
    result.brandTitle = DEFAULT.brandTitle;
    result.heroTitle = DEFAULT.heroTitle;
    result.deploy = [...DEFAULT.deploy];
    if (result.styles.length === OLD_STYLES.length && result.styles.every((item, index) => item === OLD_STYLES[index])) result.styles = [...DEFAULT.styles];
    for (const key of ['styles', 'features']) if (!result[key].includes('其他')) result[key].push('其他');
    return result;
  }

  function deployment(value) {
    if (['GitHub Pages', 'GITHUB 静态'].includes(value)) return 'GITHUB 静态';
    if (['Netlify', 'Cloudflare Pages', '我的域名（静态）'].includes(value)) return '我的域名（静态）';
    if (['香港 Ubuntu 服务器', '中国大陆服务器', '我的域名（动态）'].includes(value)) return '我的域名（动态）';
    return value === '待确认' ? '' : value;
  }

  function featureName(value) {
    return ['静态趣味单', '静态趣味菜单'].includes(value) ? '互动玩法' : value;
  }

  function rasterSource(src) {
    if (typeof src !== 'string') return false;
    const match = src.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
    if (!match) return false;
    try {
      const header = atob(match[2].slice(0, 48));
      return match[1] === 'png' ? header.startsWith('\x89PNG\r\n\x1a\n') : match[1] === 'jpeg' ? header.startsWith('\xff\xd8\xff') : header.startsWith('RIFF') && header.slice(8, 12) === 'WEBP';
    } catch { return false; }
  }

  function cleanData(source, strict = false, choices = config) {
    if (!plainObject(source)) throw new Error('项目数据格式不正确');
    const allowed = [...Object.keys(FIELD_LIMITS), ...OPTION_KEYS, 'primaryColors', 'accentColors', 'referenceImages', 'projectType'];
    if (strict && Object.keys(source).some((key) => !allowed.includes(key))) throw new Error('项目数据含有不支持的字段');
    const result = {};
    const type = Object.hasOwn(source, 'projectType') ? source.projectType : 'club';
    if ((typeof type !== 'string' || !Object.hasOwn(PROJECT_TYPES, type)) && strict) throw new Error('项目类型不正确，请使用支持的四种分类');
    result.projectType = typeof type === 'string' && Object.hasOwn(PROJECT_TYPES, type) ? type : 'club';
    for (const [key, limit] of Object.entries(FIELD_LIMITS)) {
      const value = Object.hasOwn(source, key) ? source[key] : '';
      if (typeof value !== 'string' || value.length > limit) {
        if (strict) throw new Error('项目文字格式或长度不正确');
        result[key] = typeof value === 'string' ? value : '';
      } else result[key] = value;
    }
    for (const key of OPTION_KEYS) {
      let values = Object.hasOwn(source, key) ? source[key] : [];
      if (!Array.isArray(values) || values.length > (key === 'deploy' ? 1 : 80) || values.some((value) => typeof value !== 'string' || value.length > 120)) {
        if (strict) throw new Error('勾选数据格式不正确');
        result[key] = [];
        continue;
      }
      if (key === 'deploy') values = values.map(deployment).filter(Boolean);
      if (key === 'features') values = [...new Set(values.map(featureName))];
      if (strict && values.some((value) => !choices[key].includes(value))) throw new Error('勾选项与备份中的选项不一致');
      result[key] = [...new Set(values.filter((value) => choices[key].includes(value)))];
    }
    for (const key of ['primaryColors', 'accentColors']) {
      const items = source[key] ?? [];
      const valid = Array.isArray(items) && items.length <= 8 && items.every((item) => plainObject(item) && Object.keys(item).every((field) => ['hex', 'name'].includes(field)) && typeof item.hex === 'string' && /^#[0-9a-f]{6}$/i.test(item.hex) && (item.name === undefined || (typeof item.name === 'string' && item.name.length <= 60)));
      if (!valid && strict) throw new Error('颜色数据格式不正确，请使用六位 HEX 色值');
      result[key] = valid ? items.map((item) => ({ hex: item.hex.toLowerCase(), name: item.name || '' })) : [];
    }
    const images = source.referenceImages ?? [];
    const validImages = Array.isArray(images) && images.length <= 6 && images.every((item) => plainObject(item) && Object.keys(item).every((field) => ['name', 'src'].includes(field)) && typeof item.name === 'string' && item.name.length <= 200 && rasterSource(item.src)) && images.reduce((sum, item) => sum + item.src.length, 0) <= IMAGE_LIMIT;
    if (!validImages && strict) throw new Error('参考图片格式不正确，或图片总容量超过 1.8 MB');
    result.referenceImages = validImages ? images.map((item) => ({ name: item.name, src: item.src })) : [];
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

  function formData(flush = true) {
    if (flush) flushTags();
    const data = {
      projectType,
      ...Object.fromEntries(Object.keys(FIELD_LIMITS).map((key) => [key, document.getElementById(key).value])),
      ...Object.fromEntries(OPTION_KEYS.map((key) => [key, selected(key)])),
      ...Object.fromEntries(Object.entries(colorValues).map(([key, items]) => [key, items.filter((item) => item.selected).map(({ hex, name }) => ({ hex, name }))])),
      referenceImages: referenceImages.map((item) => ({ ...item }))
    };
    for (const key of Object.keys(tagValues)) {
      const pending = $(key === 'games' ? '#gamesEntry' : '#keywordsEntry').value.trim().split(/[\s、，,；;]+/).filter(Boolean);
      data[key] = [...new Set([...tagValues[key], ...pending])].join('、');
    }
    return data;
  }

  function applyData(data) {
    projectType = data.projectType || 'club';
    for (const key of Object.keys(FIELD_LIMITS)) {
      const input = document.getElementById(key);
      input.value = data[key] || '';
      input.setCustomValidity('');
    }
    for (const key of OPTION_KEYS) {
      $$(`input[name="${key}"]`).forEach((input) => { input.checked = (data[key] || []).includes(input.value); });
    }
    for (const key of Object.keys(tagValues)) {
      tagValues[key] = (data[key] || '').split(/[\s、，,；;]+/).filter(Boolean);
      document.getElementById(key === 'games' ? 'gamesEntry' : 'keywordsEntry').value = '';
      renderTags(key);
    }
    for (const key of Object.keys(colorValues)) {
      colorValues[key] = (data[key] || []).map((item) => ({ ...item, selected: true }));
      if (!colorValues[key].length) colorValues[key].push(emptyColor(key));
      renderColors(key);
    }
    referenceGeneration += 1;
    referenceImages = (data.referenceImages || []).map((item) => ({ ...item }));
    renderReferenceImages();
    restoreHours(data.businessHours || '');
    updateOtherFields();
    renderProjectType();
    updateSummary();
  }

  function renderProjectType() {
    const project = PROJECT_TYPES[projectType];
    for (const selector of ['#summaryType', '#currentProjectType', '#breadcrumbType', '#sidebarProjectType']) $(selector).textContent = project.label;
    $('#workspaceTitle').textContent = '整理你的' + project.label + '需求';
    $('#summaryGames').previousElementSibling.textContent = project.gameLabel;
    $$('[data-project-type]').forEach((button) => {
      const active = button.dataset.projectType === projectType;
      button.classList.toggle('active', active);
      button.classList.toggle('selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
    const label = (id, text) => {
      const element = $(`label[for="${id}"]`);
      const firstText = [...element.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
      if (firstText) firstText.textContent = text + ' ';
      else element.prepend(document.createTextNode(text + ' '));
    };
    label('clubName', project.nameLabel);
    label('gamesEntry', project.gameLabel + (projectType === 'other' ? '（选填）' : ''));
    const contentIds = ['menuCount', 'staffCount', 'menuCategories', 'contentModules'];
    contentIds.forEach((id, index) => label(id, project.contentLabels[index]));
    ['clubName', ...contentIds].forEach((id, index) => { document.getElementById(id).placeholder = project.placeholders[index]; });
    $('#title-basic').textContent = project.basicHeading;
    $('#title-basic').nextElementSibling.textContent = project.basicDesc;
    $('#title-content').textContent = project.contentHeading;
    $('#title-content').nextElementSibling.textContent = project.contentDesc;
    $('#clubName').parentElement.querySelector('small').textContent = '生成需求单前，请填写' + project.nameLabel + '。';
    const game = projectType === 'club' ? '游戏' : project.gameLabel;
    $('#gamesEntry').placeholder = '输入王者荣耀，按空格添加下一个' + game;
    $('#gamesHint').textContent = '空格或回车添加一个' + game + '，点击标签旁的 × 可移除。';
    label('audience', projectType === 'club' ? '主要客户群' : projectType === 'event' ? '参与人群' : '主要用户');
    $('#audience').placeholder = projectType === 'club' ? '例如：大学生、女性玩家、三角洲玩家' : projectType === 'event' ? '例如：俱乐部成员、报名玩家、活动访客' : '例如：游戏玩家、会员、内部使用人员';
    const club = projectType === 'club';
    label('contactMethods', club ? '客服渠道' : '联系渠道');
    label('contactId', club ? '主要客服号' : '主要联系账号');
    $('#serviceStart').closest('fieldset').querySelector('legend').textContent = club ? '客服时间' : '联系时间';
    $('#title-contact').textContent = club ? '让客户找到你' : '让参与者或用户找到你';
    $('#title-contact').nextElementSibling.textContent = club ? '填写俱乐部的客服信息，以及预计的网站部署方式。' : '填写项目的联系信息，以及预计的网站部署方式。';
    $('#contactId').placeholder = club ? '填写俱乐部客服的账号' : '填写项目联系人或客服的账号';
    $('#materialChoices input[value="俱乐部介绍文案"]')?.parentElement.querySelector('span:last-child')?.replaceChildren(document.createTextNode(club ? '俱乐部介绍文案' : '项目介绍文案'));
  }

  function tagEmoji(key, label) {
    if (key === 'games') {
      for (const [pattern, emoji] of [[/王者/, '👑'], [/三角洲/, '🎯'], [/无畏|valorant/i, '⚡'], [/和平|吃鸡|PUBG/i, '🪂'], [/英雄联盟|LOL/i, '🏆'], [/永劫/, '⚔️'], [/原神/, '🌟']]) if (pattern.test(label)) return emoji;
      return '🎮';
    }
    for (const [pattern, emoji] of [[/干净|简约|极简/, '🤍'], [/年轻|活力/, '🌱'], [/游戏|电竞/, '🎮'], [/可爱|甜|少女/, '🎀'], [/高级|精致/, '💎'], [/自然|清新/, '🍃'], [/彩色|彩虹/, '🌈'], [/酷|暗黑|科技/, '⚡']]) if (pattern.test(label)) return emoji;
    return '✨';
  }

  function renderTags(key) {
    const container = $(key === 'games' ? '#gamesTags' : '#keywordTags');
    container.replaceChildren();
    tagValues[key].forEach((label, index) => {
      const chip = document.createElement('span');
      chip.className = 'tag-chip';
      const text = document.createElement('span');
      text.textContent = tagEmoji(key, label) + ' ' + label;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = '×';
      remove.setAttribute('aria-label', '移除 ' + label);
      remove.addEventListener('click', () => { tagValues[key].splice(index, 1); renderTags(key); scheduleSave(); });
      chip.append(text, remove);
      container.append(chip);
    });
    document.getElementById(key).value = tagValues[key].join('、');
  }

  function commitTag(key) {
    const entry = $(key === 'games' ? '#gamesEntry' : '#keywordsEntry');
    const labels = entry.value.trim().split(/[\s、，,；;]+/).filter(Boolean);
    if (!labels.length) { entry.value = ''; return; }
    const next = [...new Set([...tagValues[key], ...labels])];
    if (next.some((label) => label.length > 100) || next.join('、').length > FIELD_LIMITS[key]) {
      entry.setCustomValidity('标签总长度不能超过 500 字，每项不能超过 100 字');
      toast('标签内容太长，请缩短后再添加');
      return;
    }
    tagValues[key] = next;
    entry.value = '';
    entry.setCustomValidity('');
    renderTags(key);
  }

  function flushTags() {
    for (const key of Object.keys(tagValues)) commitTag(key);
  }

  function emptyColor(key) {
    return { hex: key === 'primaryColors' ? '#ffffff' : '#3983eb', name: '', selected: false };
  }

  function renderColors(key) {
    const container = $(key === 'primaryColors' ? '#primaryColorList' : '#accentColorList');
    const title = key === 'primaryColors' ? '品牌主色' : '辅助色';
    container.replaceChildren();
    colorValues[key].forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'color-row';
      const picker = document.createElement('input');
      picker.type = 'color';
      picker.className = 'color-picker';
      picker.value = item.hex;
      picker.setAttribute('aria-label', `${title} ${index + 1} 颜色`);
      const code = document.createElement('span');
      code.className = 'color-hex';
      code.textContent = item.selected ? item.hex.toUpperCase() : '点击选色';
      const name = document.createElement('input');
      name.type = 'text';
      name.className = 'color-name';
      name.maxLength = 60;
      name.value = item.name;
      name.placeholder = '颜色备注（选填）';
      name.setAttribute('aria-label', `${title} ${index + 1} 备注`);
      const adopt = document.createElement('button');
      adopt.type = 'button';
      adopt.className = 'color-adopt';
      adopt.textContent = item.selected ? '已选' : '采用';
      adopt.setAttribute('aria-label', `采用${title} ${index + 1} 当前颜色`);
      const choose = () => { item.selected = true; code.textContent = item.hex.toUpperCase(); adopt.textContent = '已选'; };
      for (const eventName of ['input', 'change']) {
        picker.addEventListener(eventName, () => { item.hex = picker.value; choose(); });
        name.addEventListener(eventName, () => { item.name = name.value; choose(); });
      }
      adopt.addEventListener('click', () => { choose(); scheduleSave(); });
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'color-remove';
      remove.textContent = '×';
      remove.setAttribute('aria-label', `移除${title} ${index + 1}`);
      remove.addEventListener('click', () => {
        colorValues[key].splice(index, 1);
        if (!colorValues[key].length) colorValues[key].push(emptyColor(key));
        renderColors(key);
        scheduleSave();
      });
      row.append(picker, code, name, adopt, remove);
      container.append(row);
    });
    const legacy = value(key === 'primaryColors' ? 'brandColor' : 'accentColor');
    if (legacy) {
      const note = document.createElement('small');
      note.className = 'color-legacy';
      note.textContent = '原草稿颜色说明：' + legacy;
      container.append(note);
    }
    $(key === 'primaryColors' ? '#addPrimaryColorBtn' : '#addAccentColorBtn').disabled = colorValues[key].length >= 8;
  }

  function updateOtherFields() {
    $('#styleOtherField').hidden = !selected('styles').includes('其他');
    $('#featureOtherField').hidden = !selected('features').includes('其他');
  }

  function restoreHours(text) {
    const allDay = /^(?:24\s*H|24小时|全天)$/i.test(text.trim());
    const match = text.trim().match(/^(?:(\d{1,2}):(\d{2}))?\s*[-–—~至]\s*(?:次日\s*)?(?:(\d{1,2}):(\d{2}))?$/);
    const valid = match && (!match[1] || Number(match[1]) < 24 && Number(match[2]) < 60) && (!match[3] || Number(match[3]) < 24 && Number(match[4]) < 60);
    $('#serviceAllDay').checked = allDay;
    $('#serviceStart').value = valid && match[1] ? match[1].padStart(2, '0') + ':' + match[2] : '';
    $('#serviceEnd').value = valid && match[3] ? match[3].padStart(2, '0') + ':' + match[4] : '';
    $('#serviceStart').disabled = allDay;
    $('#serviceEnd').disabled = allDay;
    $('#legacyHoursNote').textContent = text && !allDay && !valid ? '原草稿时间：' + text + '（可选择时间重新设置）' : '';
    $('#legacyHoursNote').hidden = !$('#legacyHoursNote').textContent;
  }

  function updateHours() {
    const allDay = $('#serviceAllDay').checked;
    const start = $('#serviceStart').value;
    const end = $('#serviceEnd').value;
    $('#serviceStart').disabled = allDay;
    $('#serviceEnd').disabled = allDay;
    $('#businessHours').value = allDay ? '24H' : start && end ? start + '–' + (end < start ? '次日 ' : '') + end : start || end ? start + '–' + end : '';
    $('#legacyHoursNote').hidden = true;
    $('#legacyHoursNote').textContent = '';
  }

  function renderReferenceImages() {
    const gallery = $('#referenceGallery');
    gallery.replaceChildren();
    referenceImages.forEach((item, index) => {
      const figure = document.createElement('figure');
      figure.className = 'reference-card';
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = '参考图片：' + item.name;
      const caption = document.createElement('figcaption');
      caption.textContent = item.name;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = '×';
      remove.setAttribute('aria-label', '移除参考图片 ' + item.name);
      remove.addEventListener('click', () => { referenceImages.splice(index, 1); renderReferenceImages(); scheduleSave(); });
      figure.append(img, caption, remove);
      gallery.append(figure);
    });
    $('#referenceImageStatus').textContent = referenceImages.length ? `已添加 ${referenceImages.length} / 6 张 · 仅保存在此浏览器，生成图片 / PDF 时一并附上` : '支持 JPG、PNG、WebP、GIF，最多 6 张，每张原图不超过 10 MB。';
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => image.naturalWidth && image.naturalHeight ? resolve(image) : reject(new Error('图片为空'));
      image.onerror = () => reject(new Error('图片无法读取，请换一张图片'));
      image.src = src;
    });
  }

  async function addReferenceImages(event) {
    const files = [...event.target.files];
    event.target.value = '';
    if (!files.length || readingImages) return;
    readingImages = true;
    event.target.disabled = true;
    const generation = referenceGeneration;
    let added = 0;
    try {
      for (const file of files) {
        if (generation !== referenceGeneration) break;
        if (referenceImages.length >= 6) { toast('最多添加 6 张参考图片'); break; }
        if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) { toast(file.name + '：请使用 JPG、PNG、WebP 或 GIF 图片'); continue; }
        if (file.size > 10 * 1024 * 1024) { toast(file.name + '：单张原图不能超过 10 MB'); continue; }
        const url = URL.createObjectURL(file);
        try {
          const image = await loadImage(url);
          const scale = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
          const context = canvas.getContext('2d');
          if (!context) throw new Error('当前浏览器无法处理图片');
          context.fillStyle = '#fff';
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          const src = canvas.toDataURL('image/jpeg', 0.78);
          if (src.length + referenceImages.reduce((sum, item) => sum + item.src.length, 0) > IMAGE_LIMIT) throw new Error('参考图片总容量超过 1.8 MB，请减少图片或使用更小的图片');
          if (generation !== referenceGeneration) break;
          referenceImages.push({ name: file.name.slice(0, 200), src });
          added += 1;
          renderReferenceImages();
        } catch (error) { toast(file.name + '：' + error.message); }
        finally { URL.revokeObjectURL(url); }
      }
      if (added) saveDraft();
    } finally {
      readingImages = false;
      event.target.disabled = false;
      updateSummary();
    }
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
        text.textContent = key === 'features' && item === '付款页面' ? '付款页面（不建议做）' : item;
        label.append(input, check, text);
        if (key === 'features' && ['价格计算', '数据统计'].includes(item)) {
          const help = document.createElement('button');
          help.type = 'button';
          help.className = 'feature-help';
          help.textContent = '?';
          help.setAttribute('aria-label', '了解' + item);
          help.setAttribute('aria-expanded', 'false');
          const tooltip = document.createElement('span');
          tooltip.id = item === '价格计算' ? 'priceFeatureHelp' : 'statsFeatureHelp';
          tooltip.className = 'feature-tooltip';
          tooltip.setAttribute('role', 'tooltip');
          tooltip.textContent = item === '价格计算' ? '按所选菜单、数量或时长自动汇总预估价格，最终价格仍由客服确认。' : '记录访问量、热门菜单和点击等数据，需要明确统计范围与隐私规则。';
          help.setAttribute('aria-describedby', tooltip.id);
          help.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const open = help.getAttribute('aria-expanded') !== 'true';
            help.setAttribute('aria-expanded', String(open));
            label.classList.toggle('help-open', open);
          });
          help.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') { event.stopPropagation(); help.setAttribute('aria-expanded', 'false'); label.classList.remove('help-open'); }
          });
          label.append(help, tooltip);
        }
        fragment.append(label);
      }
      $(containers[key]).replaceChildren(fragment);
    }
    $('#brandTitle').textContent = config.brandTitle;
    $('#heroTitle').textContent = config.heroTitle;
    $('#heroDesc').textContent = config.heroDesc;
    $('#footerBrand').textContent = config.brandTitle + ' · by akihowaito';
    document.title = config.brandTitle;
  }

  function completedSteps() {
    return STEP_FIELDS.map((fields, step) => fields.some((key) => value(key)) || (STEP_OPTIONS[step] !== null && selected(STEP_OPTIONS[step]).length > 0) || (step === 1 && Object.values(colorValues).some((items) => items.some((item) => item.selected))) || (step === 5 && referenceImages.length > 0));
  }

  function updateSummary() {
    $$('.choice input').forEach((input) => input.closest('.choice').classList.toggle('selected', input.checked));
    $('#summaryName').textContent = value('clubName') || (projectType === 'club' ? '新主场，正在酝酿。' : '新项目，正在酝酿。');
    $('#summaryGames').textContent = value('games') || '待填写';
    $('#summaryStyle').textContent = selected('styles').map((item) => item === '其他' && value('styleOther') ? value('styleOther') : item).join('、') || value('brandKeywords') || '待选择';
    const features = selected('features');
    const featureNames = features.map((item) => item === '其他' && value('featureOther') ? value('featureOther') : item);
    $('#summaryFeatures').textContent = features.length ? `${features.length} 项 · ${featureNames.slice(0, 2).join('、')}${features.length > 2 ? ' 等' : ''}` : '待选择';
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
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData(showMessage)));
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
    updateOtherFields();
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
    if (readingImages) { toast('参考图片正在处理，请稍候再生成'); return false; }
    flushTags();
    const name = $('#clubName');
    const domain = $('#domain');
    name.setCustomValidity(value('clubName') ? '' : '请先填写' + PROJECT_TYPES[projectType].nameLabel);
    domain.setCustomValidity('');
    if (value('domain')) {
      try {
        const url = new URL(value('domain'));
        if (!['https:', 'http:'].includes(url.protocol)) throw new Error();
      } catch {
        domain.setCustomValidity('请填写完整网址，例如 https://example.com');
      }
    }
    const start = $('#serviceStart');
    const end = $('#serviceEnd');
    const incompleteHours = !$('#serviceAllDay').checked && Boolean(start.value) !== Boolean(end.value);
    start.setCustomValidity(incompleteHours && !start.value ? '请补充客服开始时间' : '');
    end.setCustomValidity(incompleteHours && !end.value ? '请补充客服结束时间' : '');
    for (const [input, step] of [[name, 0], [$('#gamesEntry'), 0], [$('#keywordsEntry'), 1], [start, 4], [end, 4], [domain, 4]]) {
      if (!input.checkValidity()) {
        goStep(step, true);
        input.reportValidity();
        input.focus();
        toast(input === name ? '先填写' + PROJECT_TYPES[projectType].nameLabel + '，就可以生成需求单' : input === domain ? '请检查域名 / 已有网站的网址' : input === start || input === end ? '请同时填写开始和结束时间，或选择 24H' : '请检查标签内容长度');
        return false;
      }
    }
    return true;
  }

  function brief() {
    flushTags();
    const project = PROJECT_TYPES[projectType];
    const club = projectType === 'club';
    const field = (label, key) => `${label}：${value(key) || '待补充'}`;
    const list = (key) => selected(key).map((item) => '✓ ' + (!club && item === '俱乐部介绍文案' ? '项目介绍文案' : item) + (item === '其他' && key === 'features' && value('featureOther') ? '：' + value('featureOther') : '') + (item === '付款页面' ? '（不建议做）' : '')).join('\n') || '待确认';
    const colors = (key, legacy) => [value(legacy), ...colorValues[key].filter((item) => item.selected).map((item) => item.hex.toUpperCase() + (item.name ? ' · ' + item.name : ''))].filter(Boolean).join(' / ') || '待补充';
    const styles = selected('styles').map((item) => item + (item === '其他' && value('styleOther') ? '：' + value('styleOther') : '')).join(' / ') || '待确认';
    const images = referenceImages.length ? `参考图片：${referenceImages.length} 张\n${referenceImages.map((item) => '• ' + item.name).join('\n')}\n参考图片在长图、PDF 与 JSON 备份中；文字文件仅记录图片名称。` : '参考图片：未添加';
    return [
      `【定制化网页 · 项目需求单】\n${config.brandTitle}\n项目类型：${project.label}`,
      `【01 · 项目基础资料】\n${field(project.nameLabel, 'clubName')}\n${field('英文名称', 'clubEnglish')}\n${field(project.gameLabel, 'games')}\n${field(club ? '目标用户 / 主要客户群' : projectType === 'event' ? '参与人群' : '主要用户', 'audience')}`,
      `【02 · 品牌风格与颜色】\n品牌风格：${styles}\n品牌主色：${colors('primaryColors', 'brandColor')}\n辅助色：${colors('accentColors', 'accentColor')}\n${field('品牌关键词', 'brandKeywords')}`,
      `【03 · 内容结构与规则】\n${['menuCount', 'staffCount', 'menuCategories', 'contentModules'].map((key, index) => field(project.contentLabels[index], key)).join('\n')}`,
      `【04 · 需要的网站功能】\n${list('features')}`,
      `【05 · 联系与部署】\n${field(club ? '客服渠道' : '联系渠道', 'contactMethods')}\n${field(club ? '主要客服号' : '主要联系账号', 'contactId')}\n${field(club ? '客服时间' : '联系时间', 'businessHours')}\n部署方式：${selected('deploy')[0] || '待确认'}\n${field('域名 / 已有网站', 'domain')}`,
      `【06 · 参考与素材】\n已准备素材：\n${list('materials')}\n\n${field('参考网站 / 图片', 'reference')}\n${images}\n${field('其他要求', 'extra')}`,
      '【沟通建议】\n• 优先考虑手机端使用体验与微信内浏览习惯\n• 建议重要信息不依赖鼠标悬浮展示，桌面端独立适配\n• 可进一步沟通内容分类、交互流程与联系入口的安排\n• 最终价格、内容、规则与联系方式以项目真实资料为准\n\n说明：以上为沟通建议，未填写的内容与未选择的功能仍待确认。具体交付范围以最终确认的需求为准。'
    ].join('\n\n');
  }

  function openDialog(dialog) {
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('modal-open');
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
    if (copied) toast('已复制需求单，可粘贴发送给 akihowaito');
    else {
      showPreview();
      toast('复制未成功，请在预览中长按选择并复制文字');
    }
  }

  function filename(extension) {
    const name = Array.from(value('clubName') || '新项目').slice(0, 60).join('').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').replace(/[. ]+$/, '') || '新项目';
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

  function exportDraft() {
    clearTimeout(saveTimer);
    saveDraft();
    const backup = { version: 1, exportedAt: new Date().toISOString(), config, data: formData() };
    downloadBlob(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' }), filename('json'));
    toast('已导出当前浏览器的项目备份');
  }

  async function importDraft(event) {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast('备份文件不能超过 3 MB'); return; }
    let nextConfig;
    let nextData;
    try {
      const parsed = JSON.parse((await file.text()).replace(/^\ufeff/, ''));
      const allowed = ['version', 'exportedAt', 'config', 'data'];
      if (!plainObject(parsed) || Object.keys(parsed).some((key) => !allowed.includes(key)) || (parsed.version !== undefined && parsed.version !== 1) || (parsed.exportedAt !== undefined && typeof parsed.exportedAt !== 'string')) throw new Error('不是支持的项目备份文件');
      nextConfig = cleanConfig(parsed.config, true);
      nextData = cleanData(parsed.data, true, nextConfig);
      for (const item of nextData.referenceImages) await loadImage(item.src);
    } catch (error) {
      toast(error instanceof SyntaxError ? '文件不是有效的 JSON 备份' : error.message);
      return;
    }
    if (!confirm('导入会覆盖当前浏览器中的项目草稿。确认继续？')) return;
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
      if (!window.AkiReceipt?.render || !window.AkiReceipt?.pdf) throw new Error('生成模块未加载，请刷新页面后重试');
      const canvas = await window.AkiReceipt.render({ config, data: formData(), text, project: PROJECT_TYPES[projectType] });
      if (!canvas || canvas.width !== 1080 || canvas.height > 18000) throw new Error('内容过长，无法生成单张长图。请下载文字需求单，或缩短内容后重试');
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('长图生成失败，请下载文字需求单');
      const nextPdf = await window.AkiReceipt.pdf(canvas);
      if (!(nextPdf instanceof Blob) || !nextPdf.size) throw new Error('PDF 生成失败，请重试');
      if (imageURL) URL.revokeObjectURL(imageURL);
      if (pdfURL) URL.revokeObjectURL(pdfURL);
      imageBlob = blob;
      imageURL = URL.createObjectURL(blob);
      pdfBlob = nextPdf;
      pdfURL = URL.createObjectURL(nextPdf);
      $('#exportImage').src = imageURL;
      $('#exportImage').alt = value('clubName') + ' · 完整建站需求长图';
      $('#pdfOpenLink').href = pdfURL;
      $('#pdfOpenLink').hidden = false;
      const weChat = /MicroMessenger/i.test(navigator.userAgent);
      $('#imageHint').textContent = weChat ? '长按图片，可保存或发送给 akihowaito。PDF 可打开预览；若微信拦截下载，请在浏览器打开后保存发送。' : '长按图片或下载 PNG，也可以保存 PDF，再自行发送给 akihowaito。';
      $('#downloadImageBtn').textContent = weChat ? '长按图片保存' : '下载 PNG 长图';
      $('#shareImageBtn').textContent = canShareFile('image') ? '系统分享图片' : '长按图片发送';
      $('#sharePdfBtn').textContent = canShareFile('pdf') ? '系统分享 PDF' : '保存 PDF 后发送';
      // Restore the trigger before showModal so closing the nested dialog returns focus to it.
      button.disabled = false;
      button.textContent = previousLabel;
      button.focus();
      openDialog($('#imageDialog'));
      toast('图片与 PDF 已生成，可自行发送给 akihowaito');
    } catch (error) { toast(error.message || '长图生成失败，请下载文字需求单'); }
    finally {
      button.disabled = false;
      button.textContent = previousLabel;
    }
  }

  function shareFile(kind) {
    const blob = kind === 'pdf' ? pdfBlob : imageBlob;
    if (!blob) return null;
    return new File([blob], filename(kind === 'pdf' ? 'pdf' : 'png'), { type: kind === 'pdf' ? 'application/pdf' : 'image/png' });
  }

  function canShareFile(kind) {
    try {
      const file = shareFile(kind);
      return Boolean(file && navigator.share && navigator.canShare?.({ files: [file] }));
    } catch { return false; }
  }

  function downloadPdf() {
    if (!pdfBlob || !pdfURL) return;
    downloadURL(pdfURL, filename('pdf'));
    toast(/MicroMessenger/i.test(navigator.userAgent) ? '若微信无法下载，请在浏览器打开后保存 PDF，再发送给 akihowaito' : '已发起 PDF 下载，保存后可发送给 akihowaito');
  }

  async function shareExport(kind) {
    if (!shareFile(kind)) return;
    if (!canShareFile(kind)) {
      if (kind === 'pdf') downloadPdf();
      else { $('#exportImage').scrollIntoView({ block: 'center', behavior: 'smooth' }); toast('长按图片，可保存或发送给 akihowaito'); }
      return;
    }
    try {
      await navigator.share({ files: [shareFile(kind)], title: DEFAULT.brandTitle, text: '项目需求单' });
    } catch (error) {
      if (error.name === 'AbortError') return;
      toast(kind === 'pdf' ? '分享未完成，可打开或下载 PDF 后发送给 akihowaito' : '分享未完成，可长按或下载图片后发送给 akihowaito');
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
    } catch { storageReadError = true; applyData(cleanData({})); }
  } else applyData(cleanData({}));
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
  for (const key of Object.keys(tagValues)) {
    const entry = $(key === 'games' ? '#gamesEntry' : '#keywordsEntry');
    let composing = false;
    entry.addEventListener('compositionstart', () => { composing = true; });
    entry.addEventListener('compositionend', () => { composing = false; });
    entry.addEventListener('keydown', (event) => {
      if (composing || event.isComposing || event.keyCode === 229) return;
      if ([' ', 'Enter'].includes(event.key)) { event.preventDefault(); commitTag(key); scheduleSave(); }
    });
    entry.addEventListener('blur', () => { if (!composing) { commitTag(key); scheduleSave(); } });
  }
  for (const key of Object.keys(colorValues)) {
    $(key === 'primaryColors' ? '#addPrimaryColorBtn' : '#addAccentColorBtn').addEventListener('click', () => {
      if (colorValues[key].length >= 8) return;
      colorValues[key].push(emptyColor(key));
      renderColors(key);
    });
  }
  for (const id of ['serviceStart', 'serviceEnd', 'serviceAllDay']) {
    document.getElementById(id).addEventListener('input', updateHours);
    document.getElementById(id).addEventListener('change', updateHours);
  }
  $('#referenceFiles').addEventListener('change', addReferenceImages);
  $$('[data-project-type]').forEach((button) => button.addEventListener('click', () => {
    const type = button.dataset.projectType;
    if (!Object.hasOwn(PROJECT_TYPES, type)) return;
    projectType = type;
    renderProjectType();
    goStep(0, true);
    $('#projectWorkspace').scrollIntoView({ behavior: 'auto', block: 'start' });
    scheduleSave();
  }));
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
    if (/MicroMessenger/i.test(navigator.userAgent)) toast('长按上方图片，可保存或发送给 akihowaito');
    else { downloadURL(imageURL, filename('png')); toast('已发起下载 PNG 长图'); }
  });
  $('#shareImageBtn').addEventListener('click', () => shareExport('image'));
  $('#downloadPdfBtn').addEventListener('click', downloadPdf);
  $('#sharePdfBtn').addEventListener('click', () => shareExport('pdf'));
  $('#exportDraftBtn').addEventListener('click', exportDraft);
  $('#importDraftBtn').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', importDraft);
  $('#clearDraftBtn').addEventListener('click', () => {
    if (!confirm('清空当前项目填写内容？可先导出备份。')) return;
    clearTimeout(saveTimer);
    applyData(cleanData({}));
    goStep(0, true);
    const saved = saveDraft();
    toast(saved ? '项目草稿已清空' : '当前页面已清空，但保存失败；重新打开仍可能恢复旧草稿');
  });
  $$('[data-close]').forEach((button) => button.addEventListener('click', () => button.closest('dialog')?.close()));
  $$('dialog').forEach((dialog) => {
    dialog.addEventListener('close', () => document.body.classList.toggle('modal-open', $$('dialog[open]').length > 0));
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
  });
})();
