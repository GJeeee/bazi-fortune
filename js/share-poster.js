(function () {
  const POSTER_W = 375;
  const POSTER_H = 500;

  let sheetEl = null;
  let backdropEl = null;
  let closeBtn = null;
  let saveBtn = null;
  let friendBtn = null;
  let captureEl = null;
  let previewEl = null;
  let getCtx = null;
  let busy = false;
  let lastCanvas = null;

  function $(id) {
    return document.getElementById(id);
  }

  function getLiuriExplanation(fortune) {
    const list = fortune?.luckExplanations || [];
    return list.find((ex) => ex.name === '流日') || null;
  }

  function buildPosterData(ctx) {
    if (ctx?.mode === 'hepan' && ctx.hepan) {
      return buildHepanPosterData(ctx.hepan);
    }
    if (!ctx?.userBazi) return null;
    const dm = ctx.userBazi.day.gan;
    const wx = Bazi.getWuxingGan(dm);
    const ex = getLiuriExplanation(ctx.fortune);
    let quote =
      ex?.coreReview ||
      (ex?.risk && !/平稳|按常|整体能量/.test(ex.risk) ? ex.risk : '') ||
      '今天别当炮灰也别当缩头龟，按自己的节奏出牌就行。';

    if (quote.length > 88) quote = `${quote.slice(0, 87)}…`;

    const ref = ctx.refDate || new Date();
    const dateLabel = `${ref.getFullYear()}年${ref.getMonth() + 1}月${ref.getDate()}日`;

    return {
      dayMaster: `${dm}${wx}`,
      quote,
      dateLabel,
      url: location.href.split('#')[0],
    };
  }

  function buildHepanPosterData(hepan) {
    const quote =
      hepan.narrative?.metaphor || hepan.adviceMain || hepan.tagline || '';
    const trimmed = quote.length > 72 ? `${quote.slice(0, 71)}…` : quote;
    return {
      posterType: 'hepan',
      dayMaster: hepan.level || '合盘',
      quote: trimmed,
      dateLabel: `我与${hepan.partnerName} · ${hepan.relationLabel}`,
      subline: `${hepan.userLabel} × ${hepan.partnerLabel} · ${hepan.score}分`,
      url: location.href.split('#')[0],
    };
  }

  function posterInnerHtml(data) {
    if (data.posterType === 'hepan') {
      return `
      <p class="share-poster-kicker">${escapeHtml(data.dateLabel)}</p>
      <p class="share-poster-dm share-poster-dm--hepan">${escapeHtml(data.dayMaster)}</p>
      <p class="share-poster-subline">${escapeHtml(data.subline || '')}</p>
      <p class="share-poster-quote">${escapeHtml(data.quote)}</p>
      <div class="share-poster-foot">
        <p class="share-poster-hint">扫码测测你们的缘分</p>
        <canvas class="share-poster-qr" width="72" height="72" aria-hidden="true"></canvas>
      </div>`;
    }
    return `
      <p class="share-poster-kicker">${data.dateLabel} · 今日能量日签</p>
      <p class="share-poster-dm">${escapeHtml(data.dayMaster)}</p>
      <p class="share-poster-quote">${escapeHtml(data.quote)}</p>
      <div class="share-poster-foot">
        <p class="share-poster-hint">扫码查看你的今日剧本</p>
        <canvas class="share-poster-qr" width="72" height="72" aria-hidden="true"></canvas>
      </div>`;
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function drawQr(canvas, url) {
    if (!canvas || !url) return;
    if (typeof QRCode !== 'undefined' && QRCode.toCanvas) {
      await QRCode.toCanvas(canvas, url, {
        width: 72,
        margin: 1,
        color: { dark: '#333333', light: '#F9F7F2' },
      });
      return;
    }
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#E5E7EB';
    ctx.fillRect(0, 0, 72, 72);
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('QR', 36, 40);
  }

  async function fillPosterTargets(data) {
    if (captureEl) {
      captureEl.innerHTML = posterInnerHtml(data);
      await drawQr(captureEl.querySelector('.share-poster-qr'), data.url);
    }
    if (previewEl) {
      previewEl.innerHTML = posterInnerHtml(data);
      await drawQr(previewEl.querySelector('.share-poster-qr'), data.url);
    }
  }

  function setSheetOpen(open) {
    if (!sheetEl) return;
    sheetEl.classList.toggle('hidden', !open);
    sheetEl.classList.toggle('is-open', open);
    document.body.classList.toggle('share-sheet-open', open);
  }

  async function renderCanvas() {
    if (typeof html2canvas !== 'function') {
      throw new Error('html2canvas 未加载');
    }
    if (!captureEl) throw new Error('海报模板缺失');

    const canvas = await html2canvas(captureEl, {
      backgroundColor: '#F9F7F2',
      scale: 2,
      useCORS: true,
      logging: false,
      width: POSTER_W,
      height: POSTER_H,
      windowWidth: POSTER_W,
      windowHeight: POSTER_H,
    });
    lastCanvas = canvas;
    return canvas;
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('图片生成失败'));
      }, 'image/png');
    });
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  async function savePoster() {
    if (busy || !saveBtn) return;
    busy = true;
    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = '生成中…';

    try {
      const canvas = lastCanvas || (await renderCanvas());
      const blob = await canvasToBlob(canvas);
      const filename = `今日能量日签-${Date.now()}.png`;

      if (navigator.canShare && navigator.canShare({ files: [new File([blob], filename, { type: 'image/png' })] })) {
        const file = new File([blob], filename, { type: 'image/png' });
        await navigator.share({ files: [file], title: '我的能量日签' });
      } else {
        downloadBlob(blob, filename);
      }

      saveBtn.textContent = '保存成功';
      setTimeout(() => {
        close();
        saveBtn.textContent = originalText;
      }, 600);
    } catch (err) {
      if (err?.name !== 'AbortError') {
        console.warn('save poster failed', err);
        alert('保存失败，请稍后重试');
      }
      saveBtn.textContent = originalText;
    } finally {
      saveBtn.disabled = false;
      busy = false;
    }
  }

  async function shareToFriend() {
    if (busy) return;
    const ctx = getCtx?.();
    const data = ctx ? buildPosterData(ctx) : null;
    const text = data
      ? `我的今日能量日签 · ${data.dayMaster}\n${data.quote}`
      : '我的能量报告';

    try {
      if (lastCanvas && navigator.canShare) {
        const blob = await canvasToBlob(lastCanvas);
        const file = new File([blob], '日签.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: '我的能量日签',
            text,
            files: [file],
          });
          return;
        }
      }
      if (navigator.share) {
        await navigator.share({ title: '我的能量日签', text, url: location.href });
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${text}\n${location.href}`);
        alert('链接已复制，可粘贴分享给好友');
        return;
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
    }
    alert(text);
  }

  async function open() {
    const ctx = getCtx?.();
    if (!ctx) return;

    const data = buildPosterData(ctx);
    if (!data) return;

    lastCanvas = null;
    await fillPosterTargets(data);
    setSheetOpen(true);

    renderCanvas().catch((err) => console.warn('poster preview render', err));
  }

  function close() {
    setSheetOpen(false);
    busy = false;
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = '保存到相册';
    }
  }

  function bind(options) {
    sheetEl = options.sheet || $('share-sheet');
    backdropEl = options.backdrop || $('share-sheet-backdrop');
    closeBtn = options.closeBtn || $('share-sheet-close');
    saveBtn = options.saveBtn || $('share-save-btn');
    friendBtn = options.friendBtn || $('share-friend-btn');
    captureEl = options.captureEl || $('share-poster');
    previewEl = options.previewEl || $('share-poster-preview');
    getCtx = options.getCtx;

    if (!sheetEl || !captureEl) return null;

    backdropEl?.addEventListener('click', close);
    closeBtn?.addEventListener('click', close);
    saveBtn?.addEventListener('click', savePoster);
    friendBtn?.addEventListener('click', shareToFriend);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sheetEl.classList.contains('is-open')) close();
    });

    return { open, close, buildPosterData };
  }

  window.SharePoster = { bind, open, close, buildPosterData };
})();
