const STORAGE_KEY = 'bazi-fortune-birth';
const DEFAULT_HOUR = 11;

const form = document.getElementById('birth-form');
const formSection = document.getElementById('form-section');
const resultSection = document.getElementById('result-section');
const hourSelect = document.getElementById('birth-hour');
const editBtn = document.getElementById('edit-btn');
const submitBtn = document.getElementById('submit-btn');
const formError = document.getElementById('form-error');

function showFormError(message) {
  formError.textContent = message;
  formError.classList.remove('hidden');
}

function clearFormError() {
  formError.textContent = '';
  formError.classList.add('hidden');
}

function initHourSelect() {
  const hourValues = [23, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21];
  hourSelect.innerHTML = '';
  Bazi.HOUR_LABELS.forEach((label, i) => {
    const opt = document.createElement('option');
    opt.value = hourValues[i];
    opt.textContent = label;
    hourSelect.appendChild(opt);
  });
  hourSelect.value = String(DEFAULT_HOUR);
}

function getSelectedGender() {
  const checked = form.querySelector('input[name="gender"]:checked');
  return checked ? checked.value : 'male';
}

function readBirthFromForm() {
  const year = Number(document.getElementById('birth-year').value);
  const month = Number(document.getElementById('birth-month').value);
  const day = Number(document.getElementById('birth-day').value);
  const hour = Number(hourSelect.value);
  const gender = getSelectedGender();

  if (!year || year < 1920 || year > 2030) {
    showFormError('请填写出生年份（1920–2030）');
    document.getElementById('birth-year').focus();
    return null;
  }
  if (!month || month < 1 || month > 12) {
    showFormError('请填写出生月份（1–12）');
    document.getElementById('birth-month').focus();
    return null;
  }
  if (!day || day < 1 || day > 31) {
    showFormError('请填写出生日期（1–31）');
    document.getElementById('birth-day').focus();
    return null;
  }
  if (Number.isNaN(hour)) {
    showFormError('请选择出生时辰');
    hourSelect.focus();
    return null;
  }

  clearFormError();
  return { year, month, day, hour, gender };
}

function renderPillars(container, pillars, labels) {
  container.innerHTML = pillars
    .map((p, i) => {
      const ganWx = Bazi.getWuxingGan(p.gan);
      const zhiWx = Bazi.getWuxingZhi(p.zhi);
      const label = labels ? labels[i] : Bazi.PILLAR_LABELS[i];
      return `
        <div class="pillar">
          <div class="pillar-label">${label}</div>
          <div class="pillar-gan" data-wuxing="${ganWx}">${p.gan}</div>
          <div class="pillar-zhi" data-wuxing="${zhiWx}">${p.zhi}</div>
        </div>`;
    })
    .join('');
}

function renderLuckGrid(fortune) {
  const { dayunInfo, liunian, liuyue, liuri } = fortune;
  const dayunPillar = dayunInfo.current || dayunInfo.preLuck;
  const dayunLabel = dayunInfo.current ? '大运' : '童限';
  const dayunSub = dayunInfo.current
    ? `${dayunInfo.periodStart}–${dayunInfo.periodEnd} 岁`
    : `${Math.ceil(dayunInfo.startAge)} 岁起运`;

  const items = [
    { label: dayunLabel, gz: Bazi.formatGanZhi(dayunPillar), sub: dayunSub },
    { label: '流年', gz: Bazi.formatGanZhi(liunian), sub: `${new Date().getFullYear()} 年` },
    { label: '流月', gz: Bazi.formatGanZhi(liuyue), sub: '当月节气月' },
    { label: '流日', gz: Bazi.formatGanZhi(liuri), sub: '今日' },
  ];

  document.getElementById('luck-grid').innerHTML = items
    .map(
      (item) => `
      <div class="luck-item">
        <div class="luck-label">${item.label}</div>
        <div class="luck-gz">${item.gz}</div>
        <div class="luck-sub">${item.sub}</div>
      </div>`
    )
    .join('');

  const q = dayunInfo.qiYun;
  const dir = q.forward ? '顺行' : '逆行';
  document.getElementById('luck-meta').textContent =
    `虚岁 ${dayunInfo.age} 岁 · ${q.startYears} 岁 ${q.startMonths} 个月起运（${dir}，距${q.jieName} ${q.days} 天）`;
}

function renderEnergyList(layers) {
  document.getElementById('energy-list').innerHTML = layers
    .map(
      (layer) => `
      <div class="energy-item">
        <h4>${layer.layerName}<span class="gz">${layer.pillar}</span><span class="tag">${layer.shishen}</span></h4>
        <ul>${layer.effects.map((e) => `<li>${e}</li>`).join('')}</ul>
      </div>`
    )
    .join('');
}

function formatTodayDate(d) {
  const week = ['日', '一', '二', '三', '四', '五', '六'];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${week[d.getDay()]}`;
}

function showResult(birth) {
  const { year, month, day, hour, gender } = birth;
  const now = new Date();
  const ty = now.getFullYear();
  const tm = now.getMonth() + 1;
  const td = now.getDate();

  const userBazi = Bazi.calculateBazi(year, month, day, hour);
  const todayBazi = Bazi.calculateBazi(ty, tm, td, 12);
  const fortune = Fortune.getDailyFortune(userBazi, todayBazi, birth, gender, now);

  document.getElementById('today-date').textContent = formatTodayDate(now);
  renderPillars(document.getElementById('user-pillars'), Bazi.baziToArray(userBazi));
  renderPillars(document.getElementById('today-pillars'), Bazi.baziToArray(todayBazi));

  const dm = userBazi.day.gan;
  const dmWx = Bazi.getWuxingGan(dm);
  document.getElementById('day-master').textContent = `${dm}${dmWx}`;

  renderLuckGrid(fortune);
  document.getElementById('energy-overview').textContent = fortune.analysis.energyOverview;
  renderEnergyList(fortune.analysis.layers);

  document.getElementById('score-num').textContent = fortune.score;
  document.getElementById('summary').textContent = fortune.summary;

  const list = document.getElementById('fortune-list');
  list.innerHTML = fortune.categories
    .map(
      (c) => `
      <div class="fortune-item">
        <h3>${c.title}<span class="tag ${c.level.cls}">${c.level.label}</span></h3>
        <p>${c.text}</p>
      </div>`
    )
    .join('');

  formSection.classList.add('hidden');
  resultSection.classList.remove('hidden');
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function saveBirth(birth) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(birth));
  } catch {
    // 隐私模式等环境下 localStorage 可能不可用，不影响查看结果
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
  document.getElementById('birth-year').value = birth.year;
  document.getElementById('birth-month').value = birth.month;
  document.getElementById('birth-day').value = birth.day;
  const hourValue = String(birth.hour);
  if ([...hourSelect.options].some((opt) => opt.value === hourValue)) {
    hourSelect.value = hourValue;
  } else {
    hourSelect.value = String(DEFAULT_HOUR);
  }
  const gender = birth.gender || 'male';
  const genderInput = form.querySelector(`input[name="gender"][value="${gender}"]`);
  if (genderInput) genderInput.checked = true;
}

function handleSubmit() {
  const birth = readBirthFromForm();
  if (!birth) return;

  try {
    saveBirth(birth);
    showResult(birth);
  } catch (err) {
    console.error(err);
    showFormError('计算出错，请检查输入后重试');
  }
}

function initApp() {
  if (!window.Bazi || !window.Fortune) {
    showFormError('页面脚本加载失败，请刷新或通过本地服务器打开');
    return;
  }

  initHourSelect();
  submitBtn.addEventListener('click', handleSubmit);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSubmit();
  });
  editBtn.addEventListener('click', () => {
    resultSection.classList.add('hidden');
    formSection.classList.remove('hidden');
    clearFormError();
    formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  const saved = loadBirth();
  if (saved && saved.year && saved.month && saved.day) {
    if (!saved.gender) saved.gender = 'male';
    fillForm(saved);
    try {
      showResult(saved);
    } catch (err) {
      console.error(err);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
