const STORAGE_KEY = 'bazi-fortune-birth';
const DEFAULT_HOUR = 23;
const HOUR_UNKNOWN = 'unknown';

const homeSection = document.getElementById('home-section');
const resultSection = document.getElementById('result-section');
const form = document.getElementById('birth-form');
const hourSelect = document.getElementById('birth-hour');
const editBtn = document.getElementById('edit-btn');
const submitBtn = document.getElementById('submit-btn');
const quickBtn = document.getElementById('quick-btn');
const formError = document.getElementById('form-error');
const editBtnBottom = document.getElementById('edit-btn-bottom');
const shareBtn = document.getElementById('share-btn');
const fortuneStickBtn = document.getElementById('fortune-stick-btn');
const fortuneStickCard = document.getElementById('fortune-stick-card');
const stickMotionHint = document.getElementById('stick-motion-hint');
const hepanForm = document.getElementById('hepan-form');
const hepanHourSelect = document.getElementById('hepan-hour');
const hepanFormError = document.getElementById('hepan-form-error');
const hepanShareBtn = document.getElementById('hepan-share-btn');
const hepanResetBtn = document.getElementById('hepan-reset-btn');
const hepanEntryCard = document.getElementById('hepan-entry-card');
const hepanInputBack = document.getElementById('hepan-input-back');
const hepanResultBack = document.getElementById('hepan-result-back');
const hepanInputSection = document.getElementById('hepan-input-section');
const hepanResultSection = document.getElementById('hepan-result-section');

let lastResultCtx = null;
let lastHepanResult = null;
let lastShareMode = 'daily';
let activeLuckTab = 'liuri';
let stickController = null;

const LUCK_TAB_LAYERS = {
  liuri: '流日',
  liuyue: '流月',
  liunian: '流年',
  dayun: '大运',
};

const WUXING_BAR = {
  木: '#8FBC8F',
  火: '#E9967A',
  土: '#D2B48C',
  金: '#A9A9A9',
  水: '#B0C4DE',
};

const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function $(id) {
  return document.getElementById(id);
}

function setHtml(id, html) {
  const el = $(id);
  if (!el) throw new Error(`页面元素缺失: ${id}，请强制刷新后重试`);
  el.innerHTML = html;
}

function setText(id, text) {
  const el = $(id);
  if (!el) throw new Error(`页面元素缺失: ${id}，请强制刷新后重试`);
  el.textContent = text;
}

function showFormError(message) {
  formError.textContent = message;
  formError.classList.remove('hidden');
}

function clearFormError() {
  formError.textContent = '';
  formError.classList.add('hidden');
}

function formatDateTime(d) {
  const week = ['日', '一', '二', '三', '四', '五', '六'];
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${hh}:${mm} 星期${week[d.getDay()]}`;
}

function getCurrentHourValue() {
  return new Date().getHours();
}

function initHourSelect() {
  const hourValues = [23, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21];
  hourSelect.innerHTML = '';

  const unknownOpt = document.createElement('option');
  unknownOpt.value = HOUR_UNKNOWN;
  unknownOpt.textContent = '不清楚';
  hourSelect.appendChild(unknownOpt);

  Bazi.HOUR_LABELS.forEach((label, i) => {
    const opt = document.createElement('option');
    opt.value = String(hourValues[i]);
    opt.textContent = label;
    hourSelect.appendChild(opt);
  });

  hourSelect.value = HOUR_UNKNOWN;
}

function resolveBirthHour(rawHour, hourUnknown) {
  if (hourUnknown || rawHour === HOUR_UNKNOWN) return DEFAULT_HOUR;
  const h = Number(rawHour);
  return Number.isFinite(h) ? h : DEFAULT_HOUR;
}

function formatTodayDate(d) {
  const week = ['日', '一', '二', '三', '四', '五', '六'];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${week[d.getDay()]}`;
}

function normalizeBirth(raw) {
  const hourUnknown = raw.hourUnknown === true || raw.hour === HOUR_UNKNOWN;
  return {
    year: Number(raw.year),
    month: Number(raw.month),
    day: Number(raw.day),
    hour: resolveBirthHour(raw.hour, hourUnknown),
    hourUnknown,
    gender: raw.gender === 'female' ? 'female' : 'male',
  };
}

function wxAttr(wx) {
  return wx.replace(/"/g, '&quot;');
}

function renderGanzhiChar(gan, zhi) {
  const ganWx = Bazi.getWuxingGan(gan);
  const zhiWx = Bazi.getWuxingZhi(zhi);
  return `<span class="gz-pillar"><span class="gz-char" data-wuxing="${wxAttr(ganWx)}">${gan}</span><span class="gz-char" data-wuxing="${wxAttr(zhiWx)}">${zhi}</span></span>`;
}

function renderTodayHome() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const hour = getCurrentHourValue();
  const week = ['日', '一', '二', '三', '四', '五', '六'];

  setText('home-day-num', String(d));

  const almanac = Huangli.getDailyAlmanac(y, m, d);
  const baziNow = Bazi.calculateBazi(y, m, d, hour);
  const pillars = [baziNow.year, baziNow.month, baziNow.day, baziNow.hour];

  setText(
    'home-meta',
    `${y}年${m}月 · 星期${week[now.getDay()]} · ${almanac.yueLing}`
  );

  setHtml(
    'home-ganzhi',
    pillars.map((p) => renderGanzhiChar(p.gan, p.zhi)).join('')
  );

  const { solar } = almanac;
  setText('jieqi-note', `${solar.termName} · ${solar.hou} · ${solar.wuHou}`);

  setHtml(
    'huangli-block',
    `<span class="yiji-group"><span class="yiji-tag yiji-tag-yi">宜</span> ${almanac.yi.join(' ')}</span><span class="yiji-sep">|</span><span class="yiji-group"><span class="yiji-tag yiji-tag-ji">忌</span> ${almanac.ji.join(' ')}</span>`
  );

  setText('daily-hint', almanac.dailyHint);
  enhanceDailyHint(almanac, now);
}

async function enhanceDailyHint(almanac, refDate) {
  if (!window.DailyHint) return;
  try {
    const hint = await DailyHint.enhance(almanac, refDate);
    if (hint) setText('daily-hint', hint);
  } catch {
    // 保留本地签文
  }
}

function getSelectedGender() {
  const checked = form.querySelector('input[name="gender"]:checked');
  return checked ? checked.value : 'male';
}

function readBirthFromForm() {
  const hourVal = hourSelect.value;
  const birth = normalizeBirth({
    year: document.getElementById('birth-year').value,
    month: document.getElementById('birth-month').value,
    day: document.getElementById('birth-day').value,
    hour: hourVal === HOUR_UNKNOWN ? DEFAULT_HOUR : hourVal,
    hourUnknown: hourVal === HOUR_UNKNOWN,
    gender: getSelectedGender(),
  });

  if (!birth.year || birth.year < 1920 || birth.year > 2030) {
    showFormError('请填写出生年份（1920–2030）');
    document.getElementById('birth-year').focus();
    return null;
  }
  if (!birth.month || birth.month < 1 || birth.month > 12) {
    showFormError('请填写出生月份（1–12）');
    document.getElementById('birth-month').focus();
    return null;
  }
  if (!birth.day || birth.day < 1 || birth.day > 31) {
    showFormError('请填写出生日期（1–31）');
    document.getElementById('birth-day').focus();
    return null;
  }

  clearFormError();
  return birth;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildLocalAdvice(ex, tabKey) {
  const plain = ex?.plain || '';
  const wealth = plain.match(/钱上([^，。]+)/)?.[1];
  const emotion = plain.match(/感情([^，。]+)/)?.[1];
  const social = plain.match(/与人相处([^，。]+)/)?.[1];
  const body = plain.match(/身体([^，。]+)/)?.[1];
  const loveParts = [emotion, social].filter(Boolean).join('，');

  const fallbacks = {
    liuri: {
      work: '小步推进，把待办清单里最难的那条先划掉。',
      love: '有话好好说，别把别的场子的气带回聊天框。',
      recharge: '买杯好喝的，发呆十分钟，再决定要不要回消息。',
    },
    liuyue: {
      work: '本月适合整理账目与复盘，大单先放一放。',
      love: '约一次不聊工作的饭局，比送礼物更管用。',
      recharge: '周末留半天完全离线，比硬撑一整周划算。',
    },
    liunian: {
      work: '今年重质不重量，现金流比面子重要。',
      love: '稳定关系靠日常小默契，不靠一次大浪漫。',
      recharge: '培养一个与 KPI 无关的小爱好，当情绪缓冲区。',
    },
    dayun: {
      work: '这步大运宜建团队与系统，别把自己当永动机。',
      love: '长期关系会随角色变化，记得同步彼此期待。',
      recharge: '定期体检+短途出行，比硬扛十年更划算。',
    },
  };
  const base = fallbacks[tabKey] || fallbacks.liuri;

  return {
    work: wealth || base.work,
    love: loveParts || base.love,
    recharge: body ? `留意${body}，${base.recharge}` : base.recharge,
  };
}

function buildLocalLifeAnnotation(ex, tabKey) {
  const ss = ex?.shishen || ex?.technical?.match(/十神(\S+)/)?.[1] || '';
  if (tabKey === 'liunian') {
    return ss.includes('财')
      ? '今年是考验你现金流与消费纪律的一年，别用「投资自己」当乱花钱的借口。'
      : ss.includes('官') || ss.includes('杀')
        ? '今年像升级打怪的新章节，压力会推着你成长，但别把所有关卡一次全开。'
        : '今年的关键考题是「取舍」——抓主线，放支线，比什么都想要更划算。';
  }
  if (tabKey === 'dayun') {
    return '这步大运的主旋律是「从单打独斗转向组队副本」，学会借力和分工，比一个人硬扛更值。';
  }
  return '';
}

function buildLocalTabTitle(ex, tabKey, refDate, userBazi) {
  const dm = userBazi?.day?.gan || '';
  const dmWx = dm ? Bazi.getWuxingGan(dm) : '';
  const dmLabel = dm ? `${dm}${dmWx}` : '日主';
  if (tabKey === 'liuri') {
    return `${dmLabel}的${WEEKDAY_LABELS[refDate.getDay()]}副本`;
  }
  if (tabKey === 'liuyue') return `${ex?.pillar || '流月'} · 本月生存指南`;
  if (tabKey === 'liunian') return `${ex?.pillar || '流年'} · 年度关键考题`;
  return `${ex?.pillar || '大运'} · 十年主旋律`;
}

function renderEnergyPrescriptionCard(tabKey, refDate, userBazi, ex) {
  if (!window.EnergyPrescription) return '';
  const rx = EnergyPrescription.build(tabKey, refDate, userBazi, ex);
  return `
    <div class="energy-prescription-card" data-wuxing="${wxAttr(rx.wx)}">
      <div class="energy-prescription-head">
        <span class="energy-prescription-icon" aria-hidden="true">
          <svg viewBox="0 0 20 20" width="18" height="18"><path d="M10 2c-3 0-5 2.2-5 5.2 0 2.4 1.4 4.2 3.2 5.6L10 18l1.8-5.2C13.6 11.4 15 9.6 15 7.2 15 4.2 13 2 10 2z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>
        </span>
        <span class="energy-prescription-title">${escapeHtml(rx.title)}</span>
      </div>
      <p class="energy-prescription-line energy-prescription-yi"><span class="energy-prescription-tag">宜</span>${escapeHtml(rx.yi)}</p>
      <p class="energy-prescription-line energy-prescription-ji"><span class="energy-prescription-tag">忌</span>${escapeHtml(rx.ji)}</p>
    </div>`;
}

function renderAdviceList(advice) {
  if (!advice) return '';
  const items = [
    { emoji: '💼', label: '搞钱 / 工作', text: advice.work },
    { emoji: '❤️', label: '情感 / 社交', text: advice.love },
    { emoji: '🔋', label: '回血方式', text: advice.recharge },
  ].filter((item) => item.text);

  if (!items.length) return '';

  return `<ul class="luck-advice-list">${items
    .map(
      (item) => `
    <li class="luck-advice-item">
      <span class="luck-advice-emoji" aria-hidden="true">${item.emoji}</span>
      <div class="luck-advice-body">
        <p class="luck-advice-label">${escapeHtml(item.label)}</p>
        <p class="luck-advice-text">${escapeHtml(item.text)}</p>
      </div>
    </li>`
    )
    .join('')}</ul>`;
}

function buildPersonalityKeywords(fortune, userBazi) {
  const raw = fortune?.aiPersonality || (window.Paipan ? Paipan.buildPersonalitySummary(userBazi) : '');
  if (!raw) return '独立 · 务实 · 宜稳进';
  const parts = raw
    .split(/[。；]/)
    .map((s) => s.trim().replace(/^[^，,]+[，,]/, ''))
    .filter((s) => s.length >= 3 && s.length <= 14);
  if (parts.length >= 2) return parts.slice(0, 3).join(' · ');
  const chunks = raw.split(/[，,]/).map((s) => s.trim()).filter((s) => s.length >= 3 && s.length <= 10);
  return chunks.slice(0, 3).join(' · ') || raw.slice(0, 28);
}

function formatTabSubtitle(ex, tabKey, refDate) {
  if (!ex) return '';
  if (tabKey === 'liuri') {
    const tm = refDate.getMonth() + 1;
    const td = refDate.getDate();
    return `${ex.pillar} · ${tm}月${td}日`;
  }
  return ex.period || '';
}

function getLayerExplanation(fortune, tabKey) {
  const name = LUCK_TAB_LAYERS[tabKey];
  const list = fortune.luckExplanations || [];
  return list.find((ex) => ex.name === name) || (tabKey === 'dayun' ? list.find((ex) => ex.name === '童限') : null);
}

function renderLuckTabPanel(fortune, tabKey, refDate, userBazi) {
  const ex = getLayerExplanation(fortune, tabKey);
  if (!ex) {
    setHtml('luck-tab-panel', '<p class="luck-tab-section-text">暂无该周期解读。</p>');
    return;
  }
  const title =
    ex.aiTitle || buildLocalTabTitle(ex, tabKey, refDate, userBazi || lastResultCtx?.userBazi);
  const subtitle = formatTabSubtitle(ex, tabKey, refDate);
  const coreReview =
    ex.coreReview ||
    (ex.risk && !/平稳|按常|整体能量/.test(ex.risk) ? ex.risk : '') ||
    '今天别当炮灰也别当缩头龟，按自己的节奏出牌就行。';
  const advice = ex.advice || buildLocalAdvice(ex, tabKey);
  const lifeAnnotation =
    ex.lifeAnnotation ||
    ((tabKey === 'dayun' || tabKey === 'liunian') ? buildLocalLifeAnnotation(ex, tabKey) : '');
  const showLifeNote = (tabKey === 'dayun' || tabKey === 'liunian') && lifeAnnotation;

  setHtml(
    'luck-tab-panel',
    `
    <h3 class="luck-tab-title">${escapeHtml(title)}</h3>
    ${subtitle ? `<p class="luck-tab-subtitle">${escapeHtml(subtitle)}</p>` : ''}
    <div class="luck-tab-core">${escapeHtml(coreReview)}</div>
    ${renderEnergyPrescriptionCard(tabKey, refDate, userBazi, ex)}
    ${renderAdviceList(advice)}
    ${
      showLifeNote
        ? `<div class="luck-life-note">
      <p class="luck-life-note-label">人生批注</p>
      <p class="luck-life-note-text">${escapeHtml(lifeAnnotation)}</p>
    </div>`
        : ''
    }`
  );
}

function setActiveLuckTab(tabKey) {
  activeLuckTab = tabKey;
  document.querySelectorAll('.result-tab').forEach((btn) => {
    const on = btn.dataset.tab === tabKey;
    btn.classList.toggle('is-active', on);
    btn.setAttribute('aria-selected', on ? 'true' : 'false');
  });
}

function renderResultHero(userBazi, fortune) {
  const dm = userBazi.day.gan;
  const dmWx = Bazi.getWuxingGan(dm);
  const label = `${dm}${dmWx}`;
  if (window.WuxingIcon) {
    setHtml(
      'day-master-hero',
      `<span class="result-daymaster-inner" data-wuxing="${wxAttr(dmWx)}">${WuxingIcon.iconHtml(dmWx, 'wx-icon--hero')}<span class="result-daymaster-text">${label}</span></span>`
    );
  } else {
    setText('day-master-hero', label);
  }

  const empathy =
    window.EmpathyCopy?.build(userBazi, fortune?.aiPersonality) ||
    '别人以为你很独立，但其实你也需要被好好理解。';
  setHtml('personality-empathy', `<p class="result-empathy-text">${escapeHtml(empathy)}</p>`);

  setText('personality-keywords', buildPersonalityKeywords(fortune, userBazi));
}

function ganShishenTopHtml(name, isDay) {
  if (isDay) {
    return `<span class="paipan-card-gan-ss is-daymaster">日主</span>`;
  }
  if (!name) {
    return `<span class="paipan-card-gan-ss is-empty" aria-hidden="true">·</span>`;
  }
  return `<span class="paipan-card-gan-ss">${escapeHtml(name)}</span>`;
}

const ELEMENT_COLORS = {
  木: '#4CAF50',
  火: '#E53935',
  土: '#8D6E63',
  金: '#757575',
  水: '#1E88E5',
};

function getWxForChar(char) {
  if (!char || !window.Bazi) return null;
  if (Bazi.getGanIndex(char) >= 0) return Bazi.getWuxingGan(char);
  if (Bazi.getZhiIndex(char) >= 0) return Bazi.getWuxingZhi(char);
  return null;
}

function getFiveElementColor(char) {
  const wx = getWxForChar(char);
  return wx ? ELEMENT_COLORS[wx] : '#4A5568';
}

function gzColoredHtml(char, sizeClass) {
  const color = getFiveElementColor(char);
  return `<span class="paipan-card-char ${sizeClass}" style="color:${color}">${char}</span>`;
}

function shishenPillHtml(name) {
  if (!name) return '';
  return `<span class="paipan-ss-pill">${escapeHtml(name)}</span>`;
}

function donutSlice(cx, cy, rOuter, rInner, start, end) {
  const large = end - start > Math.PI ? 1 : 0;
  const x1 = cx + rOuter * Math.cos(start);
  const y1 = cy + rOuter * Math.sin(start);
  const x2 = cx + rOuter * Math.cos(end);
  const y2 = cy + rOuter * Math.sin(end);
  const x3 = cx + rInner * Math.cos(end);
  const y3 = cy + rInner * Math.sin(end);
  const x4 = cx + rInner * Math.cos(start);
  const y4 = cy + rInner * Math.sin(start);
  return `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4} Z`;
}

const WX_CHART_COLORS = {
  木: '#A8C5A0',
  火: '#D4A59A',
  土: '#D9C9A8',
  金: '#C4C4C4',
  水: '#A8BED4',
};

function renderWuxingDonut(percents) {
  const order = ['木', '火', '土', '金', '水'];
  const cx = 56;
  const cy = 56;
  const rOuter = 46;
  const rInner = 30;
  let angle = -Math.PI / 2;
  const slices = [];

  order.forEach((wx) => {
    const pct = percents[wx] || 0;
    if (pct <= 0) return;
    const sweep = (pct / 100) * Math.PI * 2;
    const end = angle + sweep;
    slices.push(
      `<path d="${donutSlice(cx, cy, rOuter, rInner, angle, end)}" fill="${WX_CHART_COLORS[wx]}" data-wuxing="${wx}"/>`
    );
    angle = end;
  });

  const dominant = order.slice().sort((a, b) => (percents[b] || 0) - (percents[a] || 0))[0];
  const legend = order
    .map(
      (wx) => `
    <div class="wx-donut-legend-item">
      <span class="wx-donut-dot" style="background:${WX_CHART_COLORS[wx]}"></span>
      <span class="wx-donut-name">${wx}</span>
      <span class="wx-donut-pct">${percents[wx]}%</span>
    </div>`
    )
    .join('');

  return `
    <div class="wx-donut-wrap">
      <div class="wx-donut-ring">
        <svg viewBox="0 0 112 112" class="wx-donut-svg" aria-hidden="true">
          <circle cx="${cx}" cy="${cy}" r="${rOuter}" fill="none" stroke="rgba(93,109,126,0.08)" stroke-width="${rOuter - rInner}"/>
          ${slices.join('')}
        </svg>
        <div class="wx-donut-center" data-wuxing="${wxAttr(dominant)}">
          <span class="wx-donut-center-wx">${dominant}</span>
          <span class="wx-donut-center-label">主能量</span>
        </div>
      </div>
      <div class="wx-donut-legend">${legend}</div>
    </div>`;
}

function renderPaipan(userBazi) {
  if (!window.Paipan) throw new Error('排盘模块未加载，请强制刷新页面');

  const chart = Paipan.buildPaipanChart(userBazi);
  setHtml(
    'paipan-grid',
    chart
      .map((col) => {
        const isDay = col.ganShishen === '日主';
        return `
      <div class="paipan-card-col${isDay ? ' is-day-pillar' : ''}">
        <span class="paipan-card-label">${col.label.replace('柱', '')}</span>
        <div class="paipan-card-body">
          ${ganShishenTopHtml(col.ganShishen, isDay)}
          ${gzColoredHtml(col.gan, 'paipan-card-gan')}
          ${gzColoredHtml(col.zhi, 'paipan-card-zhi')}
          <div class="paipan-card-ss">${shishenPillHtml(col.zhiShishen)}</div>
        </div>
      </div>`;
      })
      .join('')
  );

  const { percents } = Paipan.calcWuxingPercent(userBazi);
  setHtml('wuxing-bars', renderWuxingDonut(percents));
}

function renderResultPage(fortune, userBazi, refDate) {
  renderResultHero(userBazi, fortune);
  renderPaipan(userBazi);
  renderLuckTabPanel(fortune, activeLuckTab, refDate, userBazi);
}

async function handleShareReport() {
  if (!lastResultCtx) return;
  lastShareMode = 'daily';
  if (window.SharePoster) {
    const sheetTitle = document.getElementById('share-sheet-title');
    if (sheetTitle) sheetTitle.textContent = '分享日签';
    SharePoster.open();
    return;
  }
  const dm = lastResultCtx.userBazi.day.gan;
  const wx = Bazi.getWuxingGan(dm);
  const text = `我的能量报告 · ${dm}${wx}日主\n${buildPersonalityKeywords(lastResultCtx.fortune, lastResultCtx.userBazi)}`;
  try {
    if (navigator.share) {
      await navigator.share({ title: '我的能量报告', text, url: location.href });
      return;
    }
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(`${text}\n${location.href}`);
      alert('报告摘要已复制，可粘贴分享');
      return;
    }
  } catch {
    // 用户取消分享
  }
  alert(text);
}

function initHepanHourSelect() {
  if (!hepanHourSelect) return;
  const hourValues = [23, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21];
  hepanHourSelect.innerHTML = '';
  const unknownOpt = document.createElement('option');
  unknownOpt.value = HOUR_UNKNOWN;
  unknownOpt.textContent = '不清楚';
  hepanHourSelect.appendChild(unknownOpt);
  Bazi.HOUR_LABELS.forEach((label, i) => {
    const opt = document.createElement('option');
    opt.value = String(hourValues[i]);
    opt.textContent = label;
    hepanHourSelect.appendChild(opt);
  });
  hepanHourSelect.value = HOUR_UNKNOWN;
}

function showHepanError(message) {
  if (!hepanFormError) return;
  hepanFormError.textContent = message;
  hepanFormError.classList.remove('hidden');
}

function clearHepanError() {
  if (!hepanFormError) return;
  hepanFormError.textContent = '';
  hepanFormError.classList.add('hidden');
}

function readHepanForm() {
  const nickname = (document.getElementById('hepan-nickname')?.value || '').trim();
  if (!nickname) {
    showHepanError('请填写对方昵称');
    document.getElementById('hepan-nickname')?.focus();
    return null;
  }
  const relationInput = hepanForm?.querySelector('input[name="hepan-relation"]:checked');
  const relation = relationInput ? relationInput.value : 'romance';
  const hourVal = hepanHourSelect?.value || HOUR_UNKNOWN;
  const birth = normalizeBirth({
    year: document.getElementById('hepan-year')?.value,
    month: document.getElementById('hepan-month')?.value,
    day: document.getElementById('hepan-day')?.value,
    hour: hourVal === HOUR_UNKNOWN ? DEFAULT_HOUR : hourVal,
    hourUnknown: hourVal === HOUR_UNKNOWN,
    gender: 'male',
  });
  if (!birth.year || birth.year < 1920 || birth.year > 2030) {
    showHepanError('请填写对方出生年份（1920–2030）');
    return null;
  }
  if (!birth.month || birth.month < 1 || birth.month > 12) {
    showHepanError('请填写对方出生月份');
    return null;
  }
  if (!birth.day || birth.day < 1 || birth.day > 31) {
    showHepanError('请填写对方出生日期');
    return null;
  }
  clearHepanError();
  return { nickname, relation, birth };
}

function renderHepanDualBars(result) {
  const order = ['木', '火', '土', '金', '水'];
  const meName = '我';
  const partnerName = result.partnerName.length > 4 ? `${result.partnerName.slice(0, 4)}…` : result.partnerName;
  return `${order
    .map(
      (wx) => `
    <div class="hepan-dual-row">
      <span class="hepan-dual-label">${wx}</span>
      <div class="hepan-dual-track" title="${meName}">
        <div class="hepan-dual-fill is-user" data-wuxing="${wx}" style="width:${result.userPercents[wx]}%"></div>
      </div>
      <div class="hepan-dual-track" title="${escapeHtml(partnerName)}">
        <div class="hepan-dual-fill is-partner" data-wuxing="${wx}" style="width:${result.partnerPercents[wx]}%"></div>
      </div>
    </div>`
    )
    .join('')}
    <div class="hepan-dual-legend">
      <span class="leg-me">${escapeHtml(meName)}</span>
      <span class="leg-partner">${escapeHtml(partnerName)}</span>
    </div>`;
}

function renderHepanResult(result) {
  lastHepanResult = result;
  setText('hepan-score-num', String(result.score));
  setText('hepan-score-level', result.level);
  setText('hepan-score-tagline', result.tagline);
  setText(
    'hepan-pair-label',
    `${result.relationLabel} · ${result.userLabel} × ${result.partnerLabel}`
  );
  setText('hepan-wx-relation', result.wxRelation.label);
  setHtml('hepan-dual-bars', renderHepanDualBars(result));
  if (result.narrative) {
    setText('hepan-narrative-portrait', result.narrative.portrait);
    setText('hepan-narrative-metaphor', result.narrative.metaphor);
    setText('hepan-narrative-tip', result.narrative.tip);
  }
}

function resetHepanForm() {
  lastHepanResult = null;
  lastShareMode = 'daily';
  clearHepanError();
  if (hepanForm) hepanForm.reset();
  if (hepanHourSelect) hepanHourSelect.value = HOUR_UNKNOWN;
  const romance = hepanForm?.querySelector('input[name="hepan-relation"][value="romance"]');
  if (romance) romance.checked = true;
}

function handleRouteChange(route) {
  if (route === '/report' && !lastResultCtx) {
    AppRouter.navigate('/', { replace: true });
    return;
  }
  if (route === '/compatibility-input' && !lastResultCtx) {
    AppRouter.navigate('/', { replace: true });
    return;
  }
  if (route === '/compatibility-result') {
    if (!lastHepanResult) {
      AppRouter.navigate(lastResultCtx ? '/compatibility-input' : '/', { replace: true });
      return;
    }
    if (stickController) stickController.reset();
  }
}

function goToHepanInput() {
  if (!lastResultCtx) return;
  AppRouter.navigate('/compatibility-input');
}

function handleHepanSubmit(e) {
  e.preventDefault();
  if (!lastResultCtx || !window.Hepan) return;
  const input = readHepanForm();
  if (!input) return;
  const partnerBazi = Bazi.calculateBazi(
    input.birth.year,
    input.birth.month,
    input.birth.day,
    input.birth.hour
  );
  const result = Hepan.calculate(
    lastResultCtx.userBazi,
    partnerBazi,
    input.relation,
    input.nickname
  );
  renderHepanResult(result);
  AppRouter.navigate('/compatibility-result');
}

function handleHepanShare() {
  if (!lastHepanResult || !window.SharePoster) return;
  lastShareMode = 'hepan';
  const sheetTitle = document.getElementById('share-sheet-title');
  if (sheetTitle) sheetTitle.textContent = '分享合盘';
  SharePoster.open();
}

function mergeAiIntoFortune(fortune, ai) {
  if (!ai) return fortune;
  const next = { ...fortune };
  if (ai.hints && ai.hints.length) next.personalHint = ai.hints;
  if (ai.layers && ai.layers.length && Array.isArray(fortune.luckExplanations)) {
    const byName = Object.fromEntries(ai.layers.map((l) => [l.name, l]));
    next.luckExplanations = fortune.luckExplanations.map((ex) => {
      const hit = byName[ex.name];
      if (!hit) return ex;
      const aiRisk = typeof hit.risk === 'string' ? hit.risk.trim() : '';
      const advice =
        hit.advice && typeof hit.advice === 'object'
          ? {
              work: hit.advice.work || hit.advice.money || '',
              love: hit.advice.love || hit.advice.social || '',
              recharge: hit.advice.recharge || hit.advice.energy || hit.advice.health || '',
            }
          : null;
      return {
        ...ex,
        aiTitle: hit.title || ex.aiTitle,
        coreReview: hit.coreReview || ex.coreReview,
        advice: advice || ex.advice,
        lifeAnnotation: hit.lifeAnnotation || ex.lifeAnnotation,
        plain: hit.plain || ex.plain,
        timeline: hit.timeline || ex.timeline,
        risk: aiRisk || ex.risk,
        technical: hit.technical || ex.technical,
        riskFromAi: Boolean(aiRisk),
      };
    });
  }
  if (ai.personality) next.aiPersonality = ai.personality;
  return next;
}

async function enhanceResultWithAi(ctx) {
  const cfg = window.AI_FORTUNE_CONFIG;
  if (!window.AiFortune || !cfg?.enabled || !cfg?.workerUrl) return ctx.fortune;

  resultSection.classList.add('is-ai-loading');
  try {
    const ai = await AiFortune.enhance(ctx);
    return mergeAiIntoFortune(ctx.fortune, ai);
  } finally {
    resultSection.classList.remove('is-ai-loading');
  }
}

function renderDayunLiunian(fortune, refDate, userBazi) {
  renderLuckTabPanel(fortune, activeLuckTab, refDate || new Date(), userBazi);
}

async function showResult(rawBirth) {
  const birth = normalizeBirth(rawBirth);
  const now = new Date();
  const ty = now.getFullYear();
  const tm = now.getMonth() + 1;
  const td = now.getDate();

  if (!window.Fortune || typeof Fortune.getDailyFortune !== 'function') {
    throw new Error('运势模块未加载，请强制刷新页面');
  }

  const userBazi = Bazi.calculateBazi(birth.year, birth.month, birth.day, birth.hour);
  const todayBazi = Bazi.calculateBazi(ty, tm, td, 12);
  let fortune = Fortune.getDailyFortune(userBazi, todayBazi, birth, birth.gender, now);

  activeLuckTab = 'liuri';
  setActiveLuckTab('liuri');
  renderResultPage(fortune, userBazi, now);

  lastResultCtx = { userBazi, todayBazi, birth, fortune, refDate: now };
  resetHepanForm();
  if (stickController) stickController.reset();
  AppRouter.navigate('/report', { replace: true });

  fortune = await enhanceResultWithAi({
    userBazi,
    todayBazi,
    birth,
    fortune,
    refDate: now,
  });

  renderResultPage(fortune, userBazi, now);
  lastResultCtx = { userBazi, todayBazi, birth, fortune, refDate: now };
}

function showHome() {
  AppRouter.navigate('/', { replace: true });
  renderTodayHome();
  clearFormError();
}

function saveBirth(birth) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(birth));
    quickBtn.classList.remove('hidden');
  } catch {
    // 隐私模式等环境下 localStorage 可能不可用
  }
}

function loadBirth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function fillForm(birth) {
  const b = normalizeBirth(birth);
  document.getElementById('birth-year').value = b.year;
  document.getElementById('birth-month').value = b.month;
  document.getElementById('birth-day').value = b.day;
  hourSelect.value = b.hourUnknown ? HOUR_UNKNOWN : String(b.hour);
  const genderInput = form.querySelector(`input[name="gender"][value="${b.gender}"]`);
  if (genderInput) genderInput.checked = true;
}

async function runShowResult(birth) {
  try {
    await showResult(birth);
  } catch (err) {
    console.error(err);
    const msg = err && err.message ? err.message : '未知错误';
    if (msg.includes('刷新') || msg.includes('缺失') || msg.includes('未加载')) {
      showFormError(msg);
    } else {
      showFormError(`计算出错：${msg}`);
    }
  }
}

function handleSubmit() {
  const birth = readBirthFromForm();
  if (!birth) return;

  if (window.Muyu) Muyu.tapMuyu(submitBtn);

  saveBirth(birth);
  setTimeout(() => runShowResult(birth), 280);
}

function initApp() {
  if (!window.Bazi || !window.Huangli || !window.Fortune) {
    showFormError('页面脚本加载失败，请强制刷新（Ctrl+Shift+R）后重试');
    return;
  }
  if (!window.Paipan) {
    showFormError('排盘脚本未加载，请确认已更新到最新版并强制刷新');
    return;
  }
  if (!$('paipan-grid') || !$('wuxing-bars') || !$('luck-tab-panel') || !$('day-master-hero')) {
    showFormError('页面结构过旧，请强制刷新（Ctrl+Shift+R）加载最新版本');
    return;
  }

  initHourSelect();
  initHepanHourSelect();
  renderTodayHome();

  if (window.AppRouter) {
    AppRouter.start(handleRouteChange);
  }

  submitBtn.addEventListener('click', handleSubmit);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSubmit();
  });
  editBtn.addEventListener('click', showHome);
  if (editBtnBottom) editBtnBottom.addEventListener('click', showHome);
  if (shareBtn) shareBtn.addEventListener('click', handleShareReport);

  if (window.SharePoster) {
    SharePoster.bind({
      getCtx: () => {
        if (lastShareMode === 'hepan' && lastHepanResult) {
          return { mode: 'hepan', hepan: lastHepanResult, refDate: new Date() };
        }
        return lastResultCtx ? { mode: 'daily', ...lastResultCtx } : null;
      },
    });
  }

  if (hepanForm) {
    hepanForm.addEventListener('submit', handleHepanSubmit);
  }
  if (hepanEntryCard) hepanEntryCard.addEventListener('click', goToHepanInput);
  if (hepanInputBack) {
    hepanInputBack.addEventListener('click', () => AppRouter.navigate('/report'));
  }
  if (hepanResultBack) {
    hepanResultBack.addEventListener('click', () => AppRouter.navigate('/report'));
  }
  if (hepanShareBtn) hepanShareBtn.addEventListener('click', handleHepanShare);
  if (hepanResetBtn) {
    hepanResetBtn.addEventListener('click', () => {
      resetHepanForm();
      AppRouter.navigate('/compatibility-input');
    });
  }

  document.querySelectorAll('.result-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      if (!tab || !lastResultCtx) return;
      setActiveLuckTab(tab);
      renderLuckTabPanel(lastResultCtx.fortune, tab, lastResultCtx.refDate, lastResultCtx.userBazi);
    });
  });

  if (window.FortuneStick && fortuneStickBtn && fortuneStickCard) {
    stickController = FortuneStick.bind({
      btn: fortuneStickBtn,
      card: fortuneStickCard,
      noEl: $('fortune-stick-no'),
      msgEl: $('fortune-stick-msg'),
      hintEl: stickMotionHint,
      getCtx: () => lastResultCtx,
      isActive: () =>
        hepanResultSection && !hepanResultSection.classList.contains('hidden'),
    });
  }
  quickBtn.addEventListener('click', () => {
    const saved = loadBirth();
    if (saved) {
      if (window.Muyu) Muyu.tapMuyu(submitBtn);
      setTimeout(() => runShowResult(saved), 280);
    }
  });

  const saved = loadBirth();
  if (saved && saved.year && saved.month && saved.day) {
    fillForm(saved);
    quickBtn.classList.remove('hidden');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
