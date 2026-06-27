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
const fortuneStickBtn = document.getElementById('fortune-stick-btn');
const fortuneStickCard = document.getElementById('fortune-stick-card');

let lastResultCtx = null;

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

  setText('home-datetime', formatDateTime(now));

  const almanac = Huangli.getDailyAlmanac(y, m, d);
  const baziNow = Bazi.calculateBazi(y, m, d, hour);
  const pillars = [baziNow.year, baziNow.month, baziNow.day, baziNow.hour];

  setHtml(
    'home-ganzhi',
    pillars.map((p) => renderGanzhiChar(p.gan, p.zhi)).join('')
  );

  const { solar, yueLing } = almanac;
  setText(
    'jieqi-note',
    `${solar.termName} · ${solar.hou} · ${solar.wuHou} · ${yueLing}`
  );

  setHtml(
    'huangli-block',
    `
    <div class="huangli-row yi">
      <span class="hl-key">宜</span>
      <div class="hl-tags">${almanac.yi.map((t) => `<span class="hl-tag yi">${t}</span>`).join('')}</div>
    </div>
    <div class="huangli-row ji">
      <span class="hl-key">忌</span>
      <div class="hl-tags">${almanac.ji.map((t) => `<span class="hl-tag ji">${t}</span>`).join('')}</div>
    </div>`
  );

  setText('daily-hint', almanac.dailyHint);
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

function renderHpBars(energy) {
  const e = energy || { positiveRatio: 55, negativeRatio: 45, positive: 55, negative: 45 };
  const pos = e.positiveRatio ?? 55;
  const neg = e.negativeRatio ?? 100 - pos;
  setHtml(
    'hp-bars',
    `
    <div class="energy-ratio">
      <div class="energy-ratio-labels">
        <span class="energy-ratio-pos-label">正 ${pos}%</span>
        <span class="energy-ratio-neg-label">负 ${neg}%</span>
      </div>
      <div class="energy-ratio-track" role="img" aria-label="正负能量比 ${pos} 比 ${neg}">
        <div class="energy-ratio-pos" style="width:${pos}%"></div>
        <div class="energy-ratio-neg" style="width:${neg}%"></div>
      </div>
    </div>`
  );
}

function renderEnergyHints(hints) {
  const list = hints && hints.length
    ? hints
    : [{ tag: '提醒', text: '今日能量数据加载中，请刷新页面。' }];
  setHtml(
    'energy-hints',
    list
      .map(
        (item) => `
      <div class="energy-hint-item">
        <span class="energy-hint-tag">${item.tag}</span>
        <p class="energy-hint-text">${item.text}</p>
      </div>`
      )
      .join('')
  );
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
      return {
        ...ex,
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

function renderPaipan(userBazi) {
  if (!window.Paipan) throw new Error('排盘模块未加载，请强制刷新页面');

  const chart = Paipan.buildPaipanChart(userBazi);
  setHtml(
    'paipan-grid',
    chart
      .map(
        (col) => `
      <div class="paipan-col">
        <div class="paipan-col-label">${col.label}</div>
        <div class="paipan-char">
          <div class="paipan-gz" data-wuxing="${col.ganWx}">${col.gan}</div>
          <div class="paipan-ss">${col.ganShishen}</div>
        </div>
        <div class="paipan-char">
          <div class="paipan-gz" data-wuxing="${col.zhiWx}">${col.zhi}</div>
          <div class="paipan-ss">${col.zhiShishen}</div>
        </div>
      </div>`
      )
      .join('')
  );

  const { percents } = Paipan.calcWuxingPercent(userBazi);
  const pieEl = $('wuxing-pie');
  if (!pieEl) throw new Error('页面元素缺失: wuxing-pie');
  Paipan.renderWuxingPie(pieEl, percents);
  setText('personality-summary', Paipan.buildPersonalitySummary(userBazi));
}

function renderDayunLiunian(fortune, refDate, options = {}) {
  const { showRisk = true } = options;
  const { dayunInfo, liunian, liuyue, liuri, luckExplanations } = fortune;
  const now = refDate || new Date();
  const ty = now.getFullYear();
  const tm = now.getMonth() + 1;
  const td = now.getDate();
  if (!dayunInfo || !Array.isArray(dayunInfo.list)) {
    throw new Error('大运数据计算失败');
  }

  const dayunPillar = dayunInfo.current || dayunInfo.preLuck;
  const dayunLabel = dayunInfo.current ? '大运' : '童限';
  const dayunRange = dayunInfo.current
    ? `${dayunInfo.periodStart}–${dayunInfo.periodEnd} 岁`
    : `约 ${Math.ceil(dayunInfo.startAge)} 岁起运`;

  const currentItems = [
    { label: dayunLabel, gz: Bazi.formatGanZhi(dayunPillar), sub: dayunRange, active: true },
    { label: '流年', gz: Bazi.formatGanZhi(liunian), sub: `${ty} 年`, active: true },
    { label: '流月', gz: Bazi.formatGanZhi(liuyue), sub: `${tm} 月`, active: true },
    { label: '流日', gz: Bazi.formatGanZhi(liuri), sub: `${tm} 月 ${td} 日`, active: true },
  ];

  setHtml(
    'liunian-highlight',
    `<div class="luck-current-grid">${currentItems
      .map(
        (item) => `
      <div class="luck-current-item${item.active ? ' active' : ''}">
        <div class="luck-current-label">${item.label}</div>
        <div class="luck-current-gz">${item.gz}</div>
        <div class="luck-current-sub">${item.sub}</div>
      </div>`
      )
      .join('')}</div>`
  );

  const explanations = luckExplanations || [];
  setHtml(
    'luck-detail',
    explanations
      .map(
        (ex) => `
      <article class="luck-detail-block">
        <header class="luck-detail-head">
          <span class="luck-detail-name">${ex.name}</span>
          <span class="luck-detail-pillar">${ex.pillar}</span>
          <span class="luck-detail-period">${ex.period}</span>
        </header>
        <p class="luck-detail-plain">${ex.plain || ''}</p>
        ${ex.timeline ? `<p class="luck-detail-timeline">${ex.timeline}</p>` : ''}
        ${showRisk && ex.risk ? `<p class="luck-detail-risk">${ex.risk}</p>` : ''}
        <p class="luck-detail-tech">${ex.technical || ''}</p>
      </article>`
      )
      .join('')
  );

  const startAge = dayunInfo.startAge || 0;
  const items = dayunInfo.list.map((dy, i) => {
    const from = Math.floor(startAge + i * 10);
    const to = from + 10;
    const isCurrent = dayunInfo.current && dayunInfo.current.index === dy.index;
    return { ...dy, from, to, isCurrent };
  });

  setHtml(
    'dayun-scroll',
    `<div class="dayun-track">${items
      .map(
        (dy) => `
        <div class="dayun-step${dy.isCurrent ? ' active' : ''}">
          <div class="dayun-age">${dy.from}–${dy.to}岁</div>
          <div class="dayun-gz">${dy.gan}${dy.zhi}</div>
        </div>`
      )
      .join('')}</div>`
  );

  const q = dayunInfo.qiYun;
  const dir = q.forward ? '顺行' : '逆行';
  setText(
    'luck-meta',
    `虚岁 ${dayunInfo.age} 岁 · ${q.startYears} 岁 ${q.startMonths} 个月起运（${dir}，距${q.jieName} ${q.days} 天）`
  );
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

  setText('today-date', formatTodayDate(now));

  const dm = userBazi.day.gan;
  const dmWx = Bazi.getWuxingGan(dm);
  setText('day-master', `${dm}${dmWx}`);

  renderHpBars(fortune.todayEnergy);
  renderEnergyHints(fortune.personalHint);
  renderPaipan(userBazi);
  const aiEnabled = Boolean(window.AI_FORTUNE_CONFIG?.enabled && window.AI_FORTUNE_CONFIG?.workerUrl);
  renderDayunLiunian(fortune, now, { showRisk: !aiEnabled });

  homeSection.classList.add('hidden');
  resultSection.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  lastResultCtx = { userBazi, todayBazi, birth, fortune, refDate: now };
  if (fortuneStickBtn) {
    fortuneStickBtn.classList.remove('is-shaking', 'stick-revealed');
    fortuneStickBtn.disabled = false;
  }
  if (fortuneStickCard) fortuneStickCard.classList.add('hidden');

  fortune = await enhanceResultWithAi({
    userBazi,
    todayBazi,
    birth,
    fortune,
    refDate: now,
  });

  renderEnergyHints(fortune.personalHint);
  renderDayunLiunian(fortune, now);
  if (fortune.aiPersonality) {
    setText('personality-summary', fortune.aiPersonality);
  }
  lastResultCtx = { userBazi, todayBazi, birth, fortune, refDate: now };
}

function showHome() {
  resultSection.classList.add('hidden');
  homeSection.classList.remove('hidden');
  renderTodayHome();
  clearFormError();
  window.scrollTo({ top: 0, behavior: 'smooth' });
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
  if (!$('hp-bars') || !$('paipan-grid') || !$('energy-hints') || !$('luck-detail') || !$('personality-summary')) {
    showFormError('页面结构过旧，请强制刷新（Ctrl+Shift+R）加载最新版本');
    return;
  }

  initHourSelect();
  renderTodayHome();

  submitBtn.addEventListener('click', handleSubmit);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSubmit();
  });
  editBtn.addEventListener('click', showHome);
  if (window.FortuneStick && fortuneStickBtn && fortuneStickCard) {
    FortuneStick.bind({
      btn: fortuneStickBtn,
      card: fortuneStickCard,
      noEl: $('fortune-stick-no'),
      msgEl: $('fortune-stick-msg'),
      getCtx: () => lastResultCtx,
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
