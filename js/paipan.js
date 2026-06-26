const ZHI_MAIN_GAN = ['癸', '己', '甲', '乙', '戊', '丙', '丁', '己', '庚', '辛', '戊', '壬'];
const WUXING_ORDER = ['木', '火', '土', '金', '水'];
const WUXING_COLORS = {
  木: '#5a8f6a',
  火: '#c45c3e',
  土: '#b8956b',
  金: '#8a8f9a',
  水: '#4a7ba7',
};

function isYangGan(gan) {
  return Bazi.getGanIndex(gan) % 2 === 0;
}

function getShishenName(dmGan, targetGan, isDayMaster) {
  if (isDayMaster) return '日主';
  if (!targetGan || !dmGan) return '';

  const dmWx = Bazi.getWuxingGan(dmGan);
  const tgWx = Bazi.getWuxingGan(targetGan);
  const sameYY = isYangGan(dmGan) === isYangGan(targetGan);

  if (dmWx === tgWx) return sameYY ? '比肩' : '劫财';

  const sheng = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  const ke = { 木: '土', 火: '金', 土: '水', 金: '木', 水: '火' };

  if (sheng[dmWx] === tgWx) return sameYY ? '食神' : '伤官';
  if (ke[dmWx] === tgWx) return sameYY ? '偏财' : '正财';
  if (ke[tgWx] === dmWx) return sameYY ? '七杀' : '正官';
  if (sheng[tgWx] === dmWx) return sameYY ? '偏印' : '正印';
  return '';
}

function getZhiMainGan(zhi) {
  return ZHI_MAIN_GAN[Bazi.getZhiIndex(zhi)];
}

function buildPaipanChart(bazi) {
  const dmGan = bazi.day.gan;
  const pillars = Bazi.baziToArray(bazi);
  const labels = Bazi.PILLAR_LABELS;

  return pillars.map((pillar, i) => {
    const isDayPillar = i === 2;
    const ganWx = Bazi.getWuxingGan(pillar.gan);
    const zhiWx = Bazi.getWuxingZhi(pillar.zhi);
    const zhiGan = getZhiMainGan(pillar.zhi);

    return {
      label: labels[i],
      gan: pillar.gan,
      zhi: pillar.zhi,
      ganWx,
      zhiWx,
      ganShishen: getShishenName(dmGan, pillar.gan, isDayPillar),
      zhiShishen: getShishenName(dmGan, zhiGan, false),
    };
  });
}

function calcWuxingPercent(bazi) {
  const counts = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  const pillars = Bazi.baziToArray(bazi);

  pillars.forEach((p) => {
    counts[Bazi.getWuxingGan(p.gan)] += 1;
    counts[Bazi.getWuxingZhi(p.zhi)] += 1;
  });

  const total = 8;
  const percents = {};
  WUXING_ORDER.forEach((wx) => {
    percents[wx] = Math.round((counts[wx] / total) * 1000) / 10;
  });

  return { counts, percents };
}

function renderWuxingPie(container, percents) {
  const cx = 60;
  const cy = 60;
  const r = 52;
  let angle = -Math.PI / 2;
  const slices = [];

  WUXING_ORDER.forEach((wx) => {
    const pct = percents[wx];
    if (pct <= 0) return;
    const sweep = (pct / 100) * Math.PI * 2;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    angle += sweep;
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    slices.push(
      `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z" fill="${WUXING_COLORS[wx]}" />`
    );
  });

  const legend = WUXING_ORDER.map(
    (wx) => `
    <div class="pie-legend-item">
      <span class="pie-dot" style="background:${WUXING_COLORS[wx]}"></span>
      <span>${wx}</span>
      <span class="pie-pct">${percents[wx]}%</span>
    </div>`
  ).join('');

  container.innerHTML = `
    <div class="pie-wrap">
      <svg viewBox="0 0 120 120" class="pie-svg" aria-hidden="true">${slices.join('')}</svg>
      <div class="pie-legend">${legend}</div>
    </div>`;
}

const DM_PERSONALITY = {
  木: '心性向上，重原则与边界，不喜被束缚，有时略显固执。',
  火: '外热内急，表达欲强，行动快，宜学会降温与倾听。',
  土: '厚重务实，讲信用、能扛事，偶尔思虑过多、行动偏慢。',
  金: '讲分寸与规则，决断干脆，有时显得冷静甚至略硬。',
  水: '心思细、适应力强，善观察与变通，情绪如流，宜防多虑。',
};

const SHISHEN_TRAITS = {
  比肩: '独立感强，不喜依附，适合自己做主。',
  劫财: '竞争心起，敢争敢拼，注意合作中的边界。',
  食神: '温和表达，重感受与审美，人缘通常不差。',
  伤官: '创意外露，言辞锋利，宜把锋芒用在事上。',
  偏财: '机会嗅觉灵，敢试新路子，花钱宜有数。',
  正财: '务实稳健，重视积累与回报，适合细水长流。',
  七杀: '压力即动力，遇强则强，需学会给自己松绑。',
  正官: '重责任与秩序，行事有分寸，易得他人信任。',
  偏印: '直觉敏锐，喜独处思考，有时与世俗节奏不同步。',
  正印: '好学内省，宜借书本与长辈经验，心态偏稳。',
};

const WX_BALANCE = {
  木: '木气偏旺，宜动宜学，忌钻牛角尖。',
  火: '火气偏旺，热情有余，注意急躁与睡眠。',
  土: '土气偏旺，踏实可靠，忌过于保守停滞。',
  金: '金气偏旺，原则清晰，宜收一收人际上的棱角。',
  水: '水气偏旺，感受力强，宜晒太阳、多走动。',
};

function buildPersonalitySummary(bazi) {
  const dm = bazi.day.gan;
  const dmWx = Bazi.getWuxingGan(dm);
  const chart = buildPaipanChart(bazi);
  const { percents } = calcWuxingPercent(bazi);

  const shishenCounts = {};
  chart.forEach((col) => {
    [col.ganShishen, col.zhiShishen].forEach((ss) => {
      if (ss && ss !== '日主') {
        shishenCounts[ss] = (shishenCounts[ss] || 0) + 1;
      }
    });
  });

  const sortedSs = Object.entries(shishenCounts).sort((a, b) => b[1] - a[1]);
  const dominant = sortedSs[0];

  const sortedWx = WUXING_ORDER.slice().sort((a, b) => percents[b] - percents[a]);
  const strongWx = sortedWx[0];
  const weakWx = sortedWx[sortedWx.length - 1];

  const parts = [`${dm}${dmWx}日主，${DM_PERSONALITY[dmWx]}`];

  if (dominant) {
    const [ssName] = dominant;
    parts.push(`命局${ssName}气较显，${SHISHEN_TRAITS[ssName] || '对性格有持续影响。'}`);
  }

  if (percents[strongWx] >= 25) {
    parts.push(WX_BALANCE[strongWx]);
  }

  if (percents[weakWx] <= 8 && weakWx !== strongWx) {
    parts.push(`${weakWx}气略弱，可借日常习惯补一点${weakWx}的能量。`);
  }

  return parts.join('');
}

window.Paipan = {
  buildPaipanChart,
  calcWuxingPercent,
  renderWuxingPie,
  buildPersonalitySummary,
  getShishenName,
  WUXING_COLORS,
};
