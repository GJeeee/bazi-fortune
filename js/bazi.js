const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const WUXING_GAN = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水'];
const WUXING_ZHI = ['水', '土', '木', '木', '土', '火', '火', '土', '金', '金', '土', '水'];

const PILLAR_LABELS = ['年', '月', '日', '时'];

const HOUR_LABELS = [
  '子时 23:00–01:00', '丑时 01:00–03:00', '寅时 03:00–05:00',
  '卯时 05:00–07:00', '辰时 07:00–09:00', '巳时 09:00–11:00',
  '午时 11:00–13:00', '未时 13:00–15:00', '申时 15:00–17:00',
  '酉时 17:00–19:00', '戌时 19:00–21:00', '亥时 21:00–23:00',
];

const JIEQI = [
  [2, 4], [3, 6], [4, 5], [5, 6], [6, 6], [7, 7],
  [8, 8], [9, 8], [10, 8], [11, 7], [12, 7], [1, 6],
];

const JIE_NAMES = [
  '立春', '惊蛰', '清明', '立夏', '芒种', '小暑',
  '立秋', '白露', '寒露', '立冬', '大雪', '小寒',
];

function utcDate(y, m, d) {
  return Date.UTC(y, m - 1, d);
}

function daysBetween(y1, m1, d1, y2, m2, d2) {
  return Math.floor((utcDate(y2, m2, d2) - utcDate(y1, m1, d1)) / 86400000);
}

function ganZhiFromIndex(index) {
  const i = ((index % 60) + 60) % 60;
  return { gan: TIANGAN[i % 10], zhi: DIZHI[i % 12], index: i };
}

function getGanIndex(gan) {
  return TIANGAN.indexOf(gan);
}

function getZhiIndex(zhi) {
  return DIZHI.indexOf(zhi);
}

function getWuxingGan(gan) {
  return WUXING_GAN[getGanIndex(gan)];
}

function getWuxingZhi(zhi) {
  return WUXING_ZHI[getZhiIndex(zhi)];
}

function isBeforeJieqi(y, m, d, jieqiIdx) {
  const [jm, jd] = JIEQI[jieqiIdx];
  if (m < jm) return true;
  if (m > jm) return false;
  return d < jd;
}

function getBaziYear(y, m, d) {
  if (m < 2 || (m === 2 && d < 4)) return y - 1;
  return y;
}

function getYearPillar(y, m, d) {
  const by = getBaziYear(y, m, d);
  const gan = TIANGAN[(by - 4) % 10];
  const zhi = DIZHI[(by - 4) % 12];
  return { gan, zhi, label: '年' };
}

function getMonthBranchIndex(y, m, d) {
  const branches = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1];

  if (m === 1) return d >= 6 ? 1 : 0;
  if (m === 2 && d < 4) return 1;

  for (let i = JIEQI.length - 1; i >= 0; i--) {
    const [jm, jd] = JIEQI[i];
    if (jm === 1) continue;
    if (m > jm || (m === jm && d >= jd)) return branches[i];
  }
  return 1;
}

function getMonthPillar(y, m, d) {
  const baziYear = getBaziYear(y, m, d);
  const yearGanIdx = (baziYear - 4) % 10;
  const monthStartGan = (yearGanIdx % 5) * 2 + 2;
  const monthBranchIdx = getMonthBranchIndex(y, m, d);
  const monthOffset = (monthBranchIdx - 2 + 12) % 12;
  const monthGanIdx = (monthStartGan + monthOffset) % 10;

  return {
    gan: TIANGAN[monthGanIdx],
    zhi: DIZHI[monthBranchIdx],
    label: '月',
  };
}

function getDayPillar(y, m, d) {
  const index = ((54 + daysBetween(2000, 1, 1, y, m, d)) % 60 + 60) % 60;
  const { gan, zhi } = ganZhiFromIndex(index);
  return { gan, zhi, label: '日', index };
}

function getHourBranchIndex(hour) {
  if (hour === 23 || hour === 0) return 0;
  return Math.floor((hour + 1) / 2);
}

function getHourPillar(y, m, d, hour) {
  const dayGanIdx = getGanIndex(getDayPillar(y, m, d).gan);
  const hourStartGan = (dayGanIdx % 5) * 2;
  const hourBranchIdx = getHourBranchIndex(hour);
  const hourGanIdx = (hourStartGan + hourBranchIdx) % 10;

  return {
    gan: TIANGAN[hourGanIdx],
    zhi: DIZHI[hourBranchIdx],
    label: '时',
  };
}

function calculateBazi(y, m, d, hour) {
  return {
    year: getYearPillar(y, m, d),
    month: getMonthPillar(y, m, d),
    day: getDayPillar(y, m, d),
    hour: getHourPillar(y, m, d, hour),
  };
}

function baziToArray(bazi) {
  return [bazi.year, bazi.month, bazi.day, bazi.hour];
}

function formatGanZhi(pillar) {
  return pillar.gan + pillar.zhi;
}

function isYangGan(gan) {
  return getGanIndex(gan) % 2 === 0;
}

function compareDate(y1, m1, d1, y2, m2, d2) {
  const t1 = utcDate(y1, m1, d1);
  const t2 = utcDate(y2, m2, d2);
  if (t1 < t2) return -1;
  if (t1 > t2) return 1;
  return 0;
}

function getJieDatesForYear(year) {
  return JIEQI.map(([m, d], i) => ({
    year: m === 1 ? year + 1 : year,
    month: m,
    day: d,
    name: JIE_NAMES[i],
    index: i,
  }));
}

function findAdjacentJie(y, m, d, forward) {
  const candidates = [
    ...getJieDatesForYear(y - 1),
    ...getJieDatesForYear(y),
    ...getJieDatesForYear(y + 1),
  ];

  if (forward) {
    for (const jie of candidates) {
      if (compareDate(y, m, d, jie.year, jie.month, jie.day) < 0) return jie;
    }
    return candidates[candidates.length - 1];
  }

  for (let i = candidates.length - 1; i >= 0; i--) {
    const jie = candidates[i];
    if (compareDate(y, m, d, jie.year, jie.month, jie.day) > 0) return jie;
  }
  return candidates[0];
}

function calcQiYun(y, m, d, gender, yearGan) {
  const yangYear = isYangGan(yearGan);
  const forward = gender === 'male' ? yangYear : !yangYear;
  const jie = findAdjacentJie(y, m, d, forward);
  const days = Math.abs(daysBetween(y, m, d, jie.year, jie.month, jie.day));
  const years = Math.floor(days / 3);
  const months = Math.floor((days % 3) * 4);
  return { forward, startYears: years, startMonths: months, days, jieName: jie.name };
}

function stepGanZhi(gan, zhi, forward) {
  let gi = getGanIndex(gan);
  let zi = getZhiIndex(zhi);
  if (forward) {
    gi = (gi + 1) % 10;
    zi = (zi + 1) % 12;
  } else {
    gi = (gi + 9) % 10;
    zi = (zi + 11) % 12;
  }
  return { gan: TIANGAN[gi], zhi: DIZHI[zi] };
}

function buildDaYunList(monthPillar, forward, count = 8) {
  const list = [];
  let cur = { ...monthPillar };
  for (let i = 0; i < count; i++) {
    cur = stepGanZhi(cur.gan, cur.zhi, forward);
    list.push({ ...cur, index: i + 1 });
  }
  return list;
}

function getAge(y, m, d, refY, refM, refD) {
  let age = refY - y;
  if (refM < m || (refM === m && refD < d)) age -= 1;
  return Math.max(0, age);
}

function getCurrentDaYun(birth, gender, refDate) {
  const { year, month, day, hour } = birth;
  const bazi = calculateBazi(year, month, day, hour);
  const qiYun = calcQiYun(year, month, day, gender, bazi.year.gan);
  const dayunList = buildDaYunList(bazi.month, qiYun.forward);
  const ry = refDate.getFullYear();
  const rm = refDate.getMonth() + 1;
  const rd = refDate.getDate();
  const age = getAge(year, month, day, ry, rm, rd);
  const startAge = qiYun.startYears + qiYun.startMonths / 12;

  if (age < startAge) {
    return {
      qiYun,
      age,
      startAge,
      current: null,
      preLuck: bazi.month,
      list: dayunList,
    };
  }

  const idx = Math.min(Math.floor((age - startAge) / 10), dayunList.length - 1);
  const current = dayunList[idx];
  const periodStart = startAge + idx * 10;
  const periodEnd = periodStart + 10;

  return {
    qiYun,
    age,
    startAge,
    current,
    periodStart: Math.floor(periodStart),
    periodEnd: Math.floor(periodEnd),
    list: dayunList,
  };
}

function getLiuNian(y, m, d) {
  const pillar = getYearPillar(y, m, d);
  return { ...pillar, label: '流年' };
}

function getLiuYue(y, m, d) {
  const pillar = getMonthPillar(y, m, d);
  return { ...pillar, label: '流月' };
}

function getLiuRi(y, m, d) {
  const pillar = getDayPillar(y, m, d);
  return { ...pillar, label: '流日' };
}

window.Bazi = {
  TIANGAN,
  DIZHI,
  WUXING_GAN,
  WUXING_ZHI,
  PILLAR_LABELS,
  HOUR_LABELS,
  calculateBazi,
  baziToArray,
  formatGanZhi,
  getGanIndex,
  getZhiIndex,
  getWuxingGan,
  getWuxingZhi,
  getDayPillar,
  getHourBranchIndex,
  getCurrentDaYun,
  getLiuNian,
  getLiuYue,
  getLiuRi,
  isYangGan,
};
