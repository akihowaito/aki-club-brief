(() => {
  'use strict';

  const WIDTH = 1080;
  const LIMIT = 18000;
  const LEFT = 156;
  const BODY = 824;
  const INK = '#243039';
  const MUTED = '#77818a';
  const FAMILY = '"Microsoft YaHei", "PingFang SC", system-ui, "Segoe UI Emoji", sans-serif';
  const PALETTE = ['#367fd1', '#18a88f', '#df9541', '#dd658b', '#3a9bb1', '#d28b52'];
  const TITLES = ['基础资料', '视觉方向', '内容结构', '网站功能', '联系与部署', '参考与素材'];
  const FONT = (size, weight = 400) => `${weight} ${size}px ${FAMILY}`;
  const textValue = (value) => typeof value === 'string' ? value.trim() : '';
  const tags = (value) => Array.isArray(value) ? value.filter(Boolean) : textValue(value).split(/[、，,\n]+/).map((item) => item.trim()).filter(Boolean);

  function rounded(context, x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + width, y, x + width, y + height, radius);
    context.arcTo(x + width, y + height, x, y + height, radius);
    context.arcTo(x, y + height, x, y, radius);
    context.arcTo(x, y, x + width, y, radius);
    context.closePath();
  }

  async function render({ config = {}, data = {}, project } = {}) {
    const nonClub = project && project.label !== '俱乐部网页';
    if (document.fonts?.ready) await document.fonts.ready;
    const brandLogo = document.querySelector('#brandMark img');
    if (brandLogo?.decode) await brandLogo.decode().catch(() => {});
    const measuringCanvas = document.createElement('canvas');
    const measure = measuringCanvas.getContext('2d');
    if (!measure) throw new Error('当前浏览器无法生成图片，请换个浏览器后重试');
    const commands = [];
    const breaks = [0];
    let y = 86;
    const mark = (position) => {
      if (position > LIMIT) throw new Error('需求内容太长，无法完整生成图片，请缩短文字或减少参考图片后重试');
      breaks.push(Math.ceil(position));
    };
    const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('zh', { granularity: 'grapheme' }) : null;

    function wrap(value, width, font) {
      measure.font = font;
      const lines = [];
      for (const paragraph of String(value).replace(/\r\n?/g, '\n').replace(/\t/g, '  ').split('\n')) {
        let line = '';
        const characters = segmenter ? [...segmenter.segment(paragraph)].map((item) => item.segment) : Array.from(paragraph);
        for (const character of characters) {
          if (line && measure.measureText(line + character).width > width) {
            lines.push(line);
            line = character;
          } else line += character;
        }
        lines.push(line);
      }
      return lines;
    }

    function writing(value, x, top, width, size = 28, weight = 400, color = INK, lineHeight = 42, safe = true) {
      const font = FONT(size, weight);
      const lines = wrap(value, width, font);
      measure.textBaseline = 'top';
      const bounds = safe ? lines.map((line) => measure.measureText(line)) : [];
      lines.forEach((line, index) => {
        const lineY = top + index * lineHeight;
        commands.push((context) => {
          context.font = font;
          context.fillStyle = color;
          context.fillText(line, x, lineY);
        });
        if (safe) {
          const bottom = lineY + bounds[index].actualBoundingBoxDescent;
          const nextTop = index + 1 < lines.length ? lineY + lineHeight - bounds[index + 1].actualBoundingBoxAscent : lineY + lineHeight;
          const boundary = Math.ceil((bottom + nextTop) / 2);
          if (boundary > bottom && boundary < nextTop) mark(boundary);
        }
      });
      return top + lines.length * lineHeight;
    }

    function label(value) {
      y = writing(value, LEFT, y, BODY, 21, 500, MUTED, 30, false) + 9;
    }

    function field(name, value) {
      label(name);
      const present = textValue(value);
      y = writing(present || '未填写', LEFT, y, BODY, 28, 400, present ? INK : '#a0a7ae') + 24;
    }

    function chips(name, values, color) {
      const items = tags(values);
      if (!items.length) { field(name, ''); return; }
      label(name);
      let x = LEFT;
      let rowTop = y;
      let rowHeight = 0;
      for (const item of items) {
        const font = FONT(25, 500);
        measure.font = font;
        const width = Math.min(BODY, Math.ceil(measure.measureText(item).width) + 58);
        const lines = wrap(item, width - 52, font);
        const height = lines.length * 35 + 24;
        if (x > LEFT && x + width > LEFT + BODY) {
          mark(rowTop + rowHeight + 6);
          rowTop += rowHeight + 12;
          x = LEFT;
          rowHeight = 0;
        }
        const chipX = x;
        const chipY = rowTop;
        commands.push((context) => {
          rounded(context, chipX, chipY, width, height, 9);
          context.fillStyle = color + '0d';
          context.fill();
          context.strokeStyle = color + '3d';
          context.lineWidth = 1.2;
          context.stroke();
          context.strokeStyle = color;
          context.lineWidth = 2;
          context.beginPath();
          context.moveTo(chipX + 15, chipY + 29);
          context.lineTo(chipX + 20, chipY + 34);
          context.lineTo(chipX + 29, chipY + 24);
          context.stroke();
        });
        writing(item, chipX + 40, chipY + 12, width - 52, 25, 500, INK, 35, false);
        x += width + 12;
        rowHeight = Math.max(rowHeight, height);
      }
      mark(rowTop + rowHeight + 6);
      y = rowTop + rowHeight + 30;
    }

    function colorCards(name, values, description) {
      const colors = Array.isArray(values) ? values.filter((item) => /^#[\da-f]{6}$/i.test(item?.hex)) : [];
      if (colors.length) {
        label(name);
        for (const item of colors) {
          const top = y;
          const title = `${item.hex.toUpperCase()}${textValue(item.name) ? '  ·  ' + item.name.trim() : ''}`;
          const lines = wrap(title, BODY - 90, FONT(26, 500));
          const height = Math.max(66, lines.length * 38 + 20);
          commands.push((context) => {
            rounded(context, LEFT, top + 4, 52, 52, 7);
            context.fillStyle = item.hex;
            context.fill();
            context.strokeStyle = '#d8dde0';
            context.lineWidth = 1;
            context.stroke();
          });
          writing(title, LEFT + 76, top + 10, BODY - 90, 26, 500, INK, 38, false);
          y += height + 8;
          mark(y);
        }
        y += 15;
      } else if (!textValue(description)) field(name, '');
      if (textValue(description)) field(colors.length ? name + '补充' : name, description);
    }

    function section(index) {
      y += 28;
      mark(y - 8);
      const top = y;
      const color = PALETTE[index];
      commands.push((context) => {
        context.strokeStyle = '#dce1e3';
        context.lineWidth = 1.2;
        context.setLineDash([4, 6]);
        context.beginPath();
        context.moveTo(LEFT, top);
        context.lineTo(LEFT + BODY, top);
        context.stroke();
        context.setLineDash([]);
        rounded(context, LEFT, top + 25, 47, 47, 8);
        context.fillStyle = color + '15';
        context.fill();
      });
      writing(String(index + 1).padStart(2, '0'), LEFT + 10, top + 36, 36, 23, 700, color, 28, false);
      writing(TITLES[index], LEFT + 65, top + 31, BODY - 65, 34, 700, INK, 44, false);
      y = top + 100;
    }

    const title = textValue(config.brandTitle) || '定制化俱乐部网页';
    y = writing(title, LEFT + 61, y + 3, BODY - 61, 28, 600, INK, 41, false) + 36;
    y = writing(textValue(data.clubName) || (project ? '我的项目' : '我的俱乐部'), LEFT, y, BODY, 62, 700, INK, 84, false) + 12;
    y = writing(project ? `${project.label} · 需求清单` : '建站需求清单', LEFT, y, BODY, 38, 500, INK, 54, false) + 19;
    const date = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Singapore' }).format(new Date()).replace(/\//g, '.');
    y = writing(`PROJECT BRIEF  /  ${date}`, LEFT, y, BODY, 21, 500, MUTED, 32, false) + 36;
    const rainbowY = y;
    commands.push((context) => {
      const gradient = context.createLinearGradient(LEFT, 0, LEFT + 405, 0);
      ['#4895ef', '#42bec5', '#77bf7a', '#f1c96b', '#f4a26b', '#eb8dba'].forEach((color, index, all) => gradient.addColorStop(index / (all.length - 1), color));
      context.fillStyle = gradient;
      context.fillRect(LEFT, rainbowY, 405, 5);
    });
    y += 39;
    const contentsY = y;
    TITLES.forEach((name, index) => {
      const x = LEFT + (index % 3) * 280;
      const top = contentsY + Math.floor(index / 3) * 53;
      commands.push((context) => {
        context.strokeStyle = PALETTE[index];
        context.lineWidth = 1.5;
        context.strokeRect(x, top + 6, 19, 19);
      });
      writing(name, x + 31, top + 2, 228, 24, 500, INK, 35, false);
    });
    y += 119;
    mark(y);

    section(0);
    field(project?.nameLabel || '俱乐部名称', data.clubName);
    field('英文名称 / 简称', data.clubEnglish);
    chips(project?.gameLabel || '主营游戏', data.games, PALETTE[0]);
    field('主要用户 / 客群', data.audience);

    section(1);
    chips('品牌风格', data.styles, PALETTE[1]);
    if (tags(data.styles).includes('其他') && textValue(data.styleOther)) field('其他品牌风格', data.styleOther);
    colorCards('品牌主色', data.primaryColors, data.brandColor);
    colorCards('辅助色', data.accentColors, data.accentColor);
    chips('品牌关键词', data.brandKeywords, PALETTE[1]);

    section(2);
    const contentLabels = project?.contentLabels || ['菜单数量', '陪玩 / 成员数量', '菜单分类', '想展示的内容模块'];
    field(contentLabels[0], data.menuCount);
    field(contentLabels[1], data.staffCount);
    field(contentLabels[2], data.menuCategories);
    field(contentLabels[3], data.contentModules);

    section(3);
    chips('需要的网站功能', tags(data.features).map((item) => item === '付款页面' ? '付款页面（不建议做）' : item), PALETTE[3]);
    if (tags(data.features).includes('其他') && textValue(data.featureOther)) field('其他网站功能', data.featureOther);

    section(4);
    field('联系渠道', data.contactMethods);
    field(nonClub ? '主要联系账号' : '客服账号 / 联系方式', data.contactId);
    let hours = textValue(data.businessHours);
    const time = hours.match(/^(\d{2}:\d{2})\s*[–—-]\s*(\d{2}:\d{2})$/);
    if (time && time[2] < time[1]) hours = `${time[1]} – 次日 ${time[2]}`;
    field(nonClub ? '联系时间' : '客服时间', hours);
    chips('部署方式', data.deploy, PALETTE[4]);
    field('计划使用的域名', data.domain);

    section(5);
    field('参考网站 / 参考说明', data.reference);
    const photos = Array.isArray(data.referenceImages) ? data.referenceImages : [];
    for (let index = 0; index < photos.length; index++) {
      const photo = photos[index];
      const picture = await new Promise((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error('参考图片读取失败，请重新导入图片后重试'));
        element.src = photo.src;
      });
      const top = y;
      const width = BODY - 32;
      const scale = Math.min(width / picture.naturalWidth, 700 / picture.naturalHeight, 1);
      const imageWidth = Math.round(picture.naturalWidth * scale);
      const imageHeight = Math.round(picture.naturalHeight * scale);
      const filename = `参考图 ${index + 1}  /  ${textValue(photo.name) || '未命名图片'}`;
      const caption = wrap(filename, width, FONT(21));
      const height = imageHeight + caption.length * 30 + 52;
      commands.push((context) => {
        rounded(context, LEFT, top, BODY, height, 10);
        context.fillStyle = '#fafaf8';
        context.fill();
        context.strokeStyle = '#e0e4e3';
        context.lineWidth = 1;
        context.stroke();
        context.fillStyle = '#ffffff';
        context.fillRect(LEFT + 16, top + 16, width, imageHeight);
        context.drawImage(picture, LEFT + (BODY - imageWidth) / 2, top + 16, imageWidth, imageHeight);
      });
      writing(filename, LEFT + 16, top + imageHeight + 30, width, 21, 400, MUTED, 30, false);
      y += height + 18;
      mark(y - 6);
    }
    chips('现有素材', tags(data.materials).map((item) => nonClub && item === '俱乐部介绍文案' ? '项目介绍文案' : item), PALETTE[5]);
    field('其他补充 / 特别要求', data.extra);

    y += 30;
    mark(y - 14);
    const footer = y;
    commands.push((context) => {
      context.strokeStyle = '#d4dce0';
      context.lineWidth = 1.2;
      context.beginPath();
      context.moveTo(LEFT, footer);
      context.lineTo(LEFT + BODY, footer);
      context.stroke();
    });
    y = writing('整理好，就发送给 akihowaito', LEFT, y + 30, BODY, 30, 600, INK, 44, false) + 7;
    y = writing('你的想法，已经有了清晰的下一步。', LEFT, y, BODY, 22, 400, MUTED, 34, false) + 75;
    const height = Math.ceil(Math.max(1500, y));
    if (height > LIMIT) throw new Error('需求内容太长，无法完整生成图片，请缩短文字或减少参考图片后重试');
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('当前浏览器无法生成图片，请换个浏览器后重试');
    context.textBaseline = 'top';
    context.fillStyle = '#f1f3f1';
    context.fillRect(0, 0, WIDTH, height);
    rounded(context, 29, 23, WIDTH - 58, height - 48, 5);
    context.fillStyle = '#fffefb';
    context.fill();
    context.strokeStyle = '#dfe3dd';
    context.lineWidth = 1;
    context.stroke();
    context.strokeStyle = '#e7ebed';
    context.beginPath();
    context.moveTo(112, 45);
    context.lineTo(112, height - 45);
    context.stroke();
    for (let top = 100; top < height - 80; top += 330) {
      rounded(context, 49, top, 22, 58, 6);
      context.fillStyle = '#e2e6e2';
      context.fill();
      context.strokeStyle = '#c4cbc9';
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(24, top + 12);
      context.bezierCurveTo(7, top + 12, 7, top + 45, 55, top + 45);
      context.stroke();
    }
    if (brandLogo?.naturalWidth) context.drawImage(brandLogo, LEFT - 7, 73, 61, 61);
    else {
      rounded(context, LEFT, 79, 44, 44, 12);
      context.fillStyle = '#e7bdcf';
      context.fill();
    }
    commands.forEach((command) => command(context));
    canvas.akiBreaks = [...new Set([...breaks, height])].sort((a, b) => a - b);
    return canvas;
  }

  async function pdf(canvas) {
    if (!canvas?.width || !canvas?.height) throw new Error('请先生成需求图片，再生成 PDF');
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 24;
    const contentWidth = pageWidth - margin * 2;
    const scale = contentWidth / canvas.width;
    const maximumHeight = Math.floor((pageHeight - margin * 2 - 24) / scale);
    const safe = Array.isArray(canvas.akiBreaks) ? canvas.akiBreaks : [];
    const pages = [];
    for (let start = 0; start < canvas.height;) {
      const target = Math.min(canvas.height, start + maximumHeight);
      let end = target;
      if (target < canvas.height) {
        const candidates = safe.filter((position) => position > start && position <= target);
        if (!candidates.length) throw new Error('这一段内容过高，无法完整分页，请缩短内容后重试');
        end = candidates[candidates.length - 1];
      }
      pages.push({ start, end });
      start = end;
    }
    const encoder = new TextEncoder();
    const encode = (value) => encoder.encode(value);
    const chunks = [];
    const offsets = [0];
    let size = 0;
    const append = (chunk) => { chunks.push(chunk); size += chunk.length; };
    const object = (number, value) => {
      offsets[number] = size;
      append(encode(`${number} 0 obj\n${value}\nendobj\n`));
    };
    append(encode('%PDF-1.4\n'));
    append(new Uint8Array([37, 226, 227, 207, 211, 10]));
    object(1, '<< /Type /Catalog /Pages 2 0 R >>');
    object(2, `<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_, index) => `${3 + index * 3} 0 R`).join(' ')}] >>`);
    for (let index = 0; index < pages.length; index++) {
      const { start, end } = pages[index];
      const slice = document.createElement('canvas');
      slice.width = canvas.width;
      slice.height = end - start + 44;
      const context = slice.getContext('2d');
      if (!context) throw new Error('PDF 生成失败，请保存图片后重试');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, slice.width, slice.height);
      context.drawImage(canvas, 0, start, canvas.width, end - start, 0, 0, canvas.width, end - start);
      context.font = '20px system-ui, sans-serif';
      context.fillStyle = MUTED;
      context.textAlign = 'right';
      context.fillText(`${index + 1} / ${pages.length}`, slice.width - 28, slice.height - 12);
      const blob = await new Promise((resolve) => slice.toBlob(resolve, 'image/jpeg', 0.93));
      if (!blob) throw new Error('PDF 图片转换失败，请保存图片后重试');
      const jpeg = new Uint8Array(await blob.arrayBuffer());
      const number = 3 + index * 3;
      const imageHeight = slice.height * scale;
      const operation = encode(`q\n${contentWidth.toFixed(2)} 0 0 ${imageHeight.toFixed(2)} ${margin} ${(pageHeight - margin - imageHeight).toFixed(2)} cm\n/Im0 Do\nQ\n`);
      object(number, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 ${number + 1} 0 R >> >> /Contents ${number + 2} 0 R >>`);
      offsets[number + 1] = size;
      append(encode(`${number + 1} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${slice.width} /Height ${slice.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`));
      append(jpeg);
      append(encode('\nendstream\nendobj\n'));
      offsets[number + 2] = size;
      append(encode(`${number + 2} 0 obj\n<< /Length ${operation.length} >>\nstream\n`));
      append(operation);
      append(encode('endstream\nendobj\n'));
      slice.width = 0;
      slice.height = 0;
    }
    const xref = size;
    append(encode(`xref\n0 ${offsets.length}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`));
    return new Blob(chunks, { type: 'application/pdf' });
  }

  window.AkiReceipt = { render, pdf };
})();
