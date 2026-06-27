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

let lastResultCtx = null;
let activeLuckTab = 'liuri';

const LUCK_TAB_LAYERS = {
  liuri: '流日',
  liuyue: '流月',
  liunian: '流年',
  dayun: '大运',
};

const WUXING_MORANDI = {
  木: '#8fae94',
  火: '#d4a096',
  土: '#c4b59a',
  金: '#b0b4bc',
  水: '#9eb5c4',
};

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

function parsePlainSections(plain) {
  if (!plain) {
    return {
      work: '工作 / 财运：按常节奏推进即可。',
      love: '感情 / 人际：保持真诚，不必勉强。',
      health: '健康 / 状态：作息规律，劳逸结合。',
    };
  }
  const body = plain.match(/身体([^，。]+)/)?.[1];
  const wealth = plain.match(/钱上([^，。]+)/)?.[1];
  const emotion = plain.match(/感情([^，。]+)/)?.[1];
  const social = plain.match(/与人相处([^，。]+)/)?.[1];
  const loveParts = [emotion, social].filter(Boolean).join('，');
  return {
    work: wealth ? `工作 / 财运：${wealth}。` : '工作 / 财运：稳中求进，不宜冒进。',
    love: loveParts ? `感情 / 人际：${loveParts}。` : '感情 / 人际：温和沟通，留一点空间。',
    health: body ? `健康 / 状态：${body}。` : '健康 / 状态：别硬扛，适当休息。',
  };
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

function formatTabTitle(ex, tabKey, refDate) {
  if (!ex) return '';
  if (tabKey === 'liuri') {
    const tm = refDate.getMonth() + 1;
    const td = refDate.getDate();
    return `${ex.pillar}日 · ${tm}月${td}日`;
  }
  if (tabKey === 'liuyue') return `${ex.pillar} · ${ex.period || '本月'}`;
  if (tabKey === 'liunian') return `${ex.pillar} · ${ex.period || '今年'}`;
  return `${ex.pillar} · ${ex.period || '大运'}`;
}

function getLayerExplanation(fortune, tabKey) {
  const name = LUCK_TAB_LAYERS[tabKey];
  const list = fortune.luckExplanations || [];
  return list.find((ex) => ex.name === name) || (tabKey === 'dayun' ? list.find((ex) => ex.name === '童限') : null);
}

function renderLuckTabPanel(fortune, tabKey, refDate) {
  const ex = getLayerExplanation(fortune, tabKey);
  if (!ex) {
    setHtml('luck-tab-panel', '<p class="luck-tab-section-text">暂无该周期解读。</p>');
    return;
  }
  const sections = parsePlainSections(ex.plain);
  const highlight = ex.risk || '今日宜按节奏行事，忌硬扛。';
  setHtml(
    'luck-tab-panel',
    `
    <h3 class="luck-tab-title">${formatTabTitle(ex, tabKey, refDate)}</h3>
    <div class="luck-tab-highlight">${highlight}</div>
    <div class="luck-tab-section">
      <p class="luck-tab-section-text">${sections.work}</p>
    </div>
    <div class="luck-tab-section">
      <p class="luck-tab-section-text">${sections.love}</p>
    </div>
    <div class="luck-tab-section">
      <p class="luck-tab-section-text">${sections.health}</p>
    </div>`
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
  setText('day-master-hero', `${dm}${dmWx}`);
  setText('personality-keywords', buildPersonalityKeywords(fortune, userBazi));
}

function renderPaipan(userBazi) {
  if (!window.Paipan) throw new Error('排盘模块未加载，请强制刷新页面');

  const chart = Paipan.buildPaipanChart(userBazi);
  setHtml(
    'paipan-grid',
    chart
      .map(
        (col) => `
      <div class="paipan-compact-col">
        <span class="paipan-compact-label">${col.label.replace('柱', '')}</span>
        <span class="paipan-compact-gz">${col.gan}</span>
        <span class="paipan-compact-gz">${col.zhi}</span>
        <span class="paipan-compact-ss" title="${col.ganShishen} · ${col.zhiShishen}">${col.ganShishen}</span>
      </div>`
      )
      .join('')
  );

  const { percents } = Paipan.calcWuxingPercent(userBazi);
  const order = ['木', '火', '土', '金', '水'];
  setHtml(
    'wuxing-bars',
    order
      .map(
        (wx) => `
      <div class="wx-bar-row">
        <span class="wx-bar-label">${wx}</span>
        <div class="wx-bar-track"><div class="wx-bar-fill" style="width:${percents[wx]}%;background:${WUXING_MORANDI[wx]}"></div></div>
        <span class="wx-bar-pct">${percents[wx]}%</span>
      </div>`
      )
      .join('')
  );
}

function renderResultPage(fortune, userBazi, refDate) {
  renderResultHero(userBazi, fortune);
  renderPaipan(userBazi);
  renderLuckTabPanel(fortune, activeLuckTab, refDate);
}

async function handleShareReport() {
  if (!lastResultCtx) return;
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

function renderDayunLiunian(fortune, refDate) {
  renderLuckTabPanel(fortune, activeLuckTab, refDate || new Date());
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

  renderResultPage(fortune, userBazi, now);
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
  if (!$('paipan-grid') || !$('wuxing-bars') || !$('luck-tab-panel') || !$('day-master-hero')) {
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
  if (editBtnBottom) editBtnBottom.addEventListener('click', showHome);
  if (shareBtn) shareBtn.addEventListener('click', handleShareReport);

  document.querySelectorAll('.result-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      if (!tab || !lastResultCtx) return;
      setActiveLuckTab(tab);
      renderLuckTabPanel(lastResultCtx.fortune, tab, lastResultCtx.refDate);
    });
  });

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
