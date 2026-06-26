(function () {
  const B = window.Bazi;
  if (!B) return;

  const getGanIndex = B.getGanIndex.bind(B);
  const getZhiIndex = B.getZhiIndex.bind(B);
  const getWuxingGan = B.getWuxingGan.bind(B);
  const getWuxingZhi = B.getWuxingZhi.bind(B);
  const formatGanZhi = B.formatGanZhi.bind(B);

  const WUXING_SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  const WUXING_KE = { 木: '土', 火: '金', 土: '水', 金: '木', 水: '火' };

  const GAN_WUHE = [['甲', '己'], ['乙', '庚'], ['丙', '辛'], ['丁', '壬'], ['戊', '癸']];
  const ZHI_LIUHE = [['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未']];
  const ZHI_LIUCHONG = [['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥']];
  const ZHI_XING = [
    ['寅', '巳', '申'], ['丑', '戌', '未'], ['子', '卯'],
  ];

  const SHISHEN = {
    比和: '比劫',
    生我: '印绶',
    克我: '官杀',
    我生: '食伤',
    我克: '财星',
  };

  const ENERGY_DESC = {
    比和: '同气相助，精力尚可，但易有竞争或重复劳动，宜专注一事。',
    生我: '生扶之力到位，底气较足，适合学习、求助、借势而行。',
    克我: '外界约束与压力增加，宜守规矩、按流程，避免硬碰硬。',
    我生: '想法表达欲强，创意活跃，但精力消耗快，注意别过度输出。',
    我克: '务实心起，关注得失与成果，适合处理财务与具体事务。',
  };

  function pairMatch(pairs, a, b) {
    return pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  }

  function isZhiXing(a, b) {
    return ZHI_XING.some((group) => group.includes(a) && group.includes(b) && a !== b);
  }

  function wuxingRelation(my, other) {
    if (my === other) return '比和';
    if (WUXING_SHENG[my] === other) return '我生';
    if (WUXING_SHENG[other] === my) return '生我';
    if (WUXING_KE[my] === other) return '我克';
    if (WUXING_KE[other] === my) return '克我';
    return '平和';
  }

  function relationScore(relation) {
    const map = { 生我: 8, 比和: 6, 我生: 4, 我克: 5, 克我: 2, 平和: 5 };
    return map[relation] ?? 5;
  }

  function analyzePillarLayer(userDay, pillar, layerName, weight) {
    const dmGan = userDay.gan;
    const dmWx = getWuxingGan(dmGan);
    const ganWx = getWuxingGan(pillar.gan);
    const zhiWx = getWuxingZhi(pillar.zhi);
    const ganRel = wuxingRelation(dmWx, ganWx);
    const zhiRel = wuxingRelation(dmWx, zhiWx);
    let score = (relationScore(ganRel) * 0.6 + relationScore(zhiRel) * 0.4);
    const effects = [];

    effects.push(`${layerName}天干「${pillar.gan}」属${ganWx}，于日主为${SHISHEN[ganRel] || '平和'}，${ENERGY_DESC[ganRel] || '影响中性。'}`);

    const zhiNote = {
      比和: '地支同气，环境节奏与自身相近。',
      生我: '地支生扶，隐性支持增强，适合沉淀积累。',
      克我: '地支施压，身体或情绪易有负担，宜减负荷。',
      我生: '地支泄气，易分心或劳心，注意休息。',
      我克: '地支为财，现实事务牵引较多，量力而行。',
    };
    effects.push(`${layerName}地支「${pillar.zhi}」属${zhiWx}，${zhiNote[zhiRel] || '影响平和。'}`);

    if (pairMatch(GAN_WUHE, dmGan, pillar.gan)) {
      score += 1.5;
      effects.push(`${layerName}天干与日主相合，有和合、贵人、机缘之象。`);
    }
    if (pairMatch(ZHI_LIUHE, userDay.zhi, pillar.zhi)) {
      score += 1.2;
      effects.push(`${layerName}地支与日支六合，人际与环境较融洽。`);
    }
    if (pairMatch(ZHI_LIUCHONG, userDay.zhi, pillar.zhi)) {
      score -= 2;
      effects.push(`${layerName}地支与日支相冲，变动、奔波或情绪起伏需留意。`);
    }
    if (isZhiXing(userDay.zhi, pillar.zhi)) {
      score -= 1.2;
      effects.push(`${layerName}地支与日支相刑，注意口舌、纠结与内耗。`);
    }

    return {
      layerName,
      pillar: formatGanZhi(pillar),
      ganRel,
      zhiRel,
      shishen: SHISHEN[ganRel],
      score: score * weight,
      weight,
      effects,
    };
  }

  function buildTodayEnergy(userDay, todayBazi, analysis) {
    const dmWx = getWuxingGan(userDay.gan);
    let positive = 42;
    let negative = 28;

    const dayGanRel = wuxingRelation(dmWx, getWuxingGan(todayBazi.day.gan));
    const dayZhiRel = wuxingRelation(dmWx, getWuxingZhi(todayBazi.day.zhi));

    const posMap = { 生我: 14, 比和: 10, 我克: 6, 我生: 3, 克我: 0 };
    const negMap = { 克我: 16, 我生: 8, 比和: 4, 我克: 3, 生我: 0 };

    positive += posMap[dayGanRel] || 0;
    positive += (posMap[dayZhiRel] || 0) * 0.6;
    negative += negMap[dayGanRel] || 0;
    negative += (negMap[dayZhiRel] || 0) * 0.6;

    analysis.layers.forEach((layer) => {
      if (!layer || !layer.effects) return;
      positive += (relationScore(layer.ganRel) - 5) * layer.weight * 3;
      negative += (5 - relationScore(layer.ganRel)) * layer.weight * 2.5;
      layer.effects.forEach((e) => {
        if (e.includes('合')) positive += 4 * layer.weight;
        if (e.includes('冲')) negative += 10 * layer.weight;
        if (e.includes('刑')) negative += 6 * layer.weight;
      });
    });

    if (pairMatch(GAN_WUHE, userDay.gan, todayBazi.day.gan)) positive += 8;
    if (pairMatch(ZHI_LIUHE, userDay.zhi, todayBazi.day.zhi)) positive += 6;
    if (pairMatch(ZHI_LIUCHONG, userDay.zhi, todayBazi.day.zhi)) negative += 14;
    if (isZhiXing(userDay.zhi, todayBazi.day.zhi)) negative += 8;

    positive = Math.max(12, Math.min(95, Math.round(positive)));
    negative = Math.max(8, Math.min(92, Math.round(negative)));

    const total = positive + negative;
    const positiveRatio = Math.round((positive / total) * 100);
    const negativeRatio = 100 - positiveRatio;

    return { positive, negative, positiveRatio, negativeRatio };
  }

  const WX_HEALTH = {
    木: '留意肝胆、筋脉与用眼，宜拉伸、少动怒。',
    火: '留意心火与睡眠，情绪起伏时放慢节奏。',
    土: '脾胃宜温，忌生冷暴食，午后可七分饱。',
    金: '呼吸道与皮肤较敏感，注意温差与干燥。',
    水: '肾水与寒凉，足部保暖，少饮冰饮。',
  };

  function buildPersonalDailyHint(userBazi, todayBazi, analysis) {
    const { dmWx, layers, score, dayGanRel } = analysis;
    const seed = getGanIndex(userBazi.day.gan) * 7 + getZhiIndex(todayBazi.day.zhi) * 13 + score;

    let health = WX_HEALTH[dmWx] || '按常日作息，劳逸结合即可。';
    if (layers.some((l) => l.ganRel === '克我' || l.zhiRel === '克我')) {
      health += ' 官杀气显，身体易有隐性消耗，宜减负荷。';
    }
    if (layers.some((l) => l.effects.some((e) => e.includes('冲')))) {
      health += ' 逢冲之日，注意磕碰与情绪性失眠。';
    }
    if (layers.some((l) => l.effects.some((e) => e.includes('刑')))) {
      health += ' 刑动在内，少纠结、早休息。';
    }

    const caiLayers = layers.filter((l) => l.ganRel === '我克' || l.zhiRel === '我克');
    let wealth;
    if (caiLayers.length >= 2) {
      wealth = '财星叠见，小额进账或副业机会可留心，忌贪快求利。';
    } else if (caiLayers.length === 1) {
      wealth = `${caiLayers[0].layerName}财星在位，适合整理账目、跟进回款，大额投资宜缓。`;
    } else if (dayGanRel === '我克') {
      wealth = '流日财星透，今日有零星生财之机，理性消费即可。';
    } else if (score >= 65) {
      wealth = seededPick(CATEGORY_TEMPLATES.wealth.good, seed + 2);
    } else {
      wealth = seededPick(CATEGORY_TEMPLATES.wealth.mid, seed + 2);
    }

    const hasHe = layers.some((l) => l.effects.some((e) => e.includes('合')));
    const hasGuan = layers.some((l) => l.ganRel === '克我' || l.shishen === '官杀');
    let love;
    if (hasHe) {
      love = '合气在位，单身易有轻缘，有伴宜表达关怀、小惊喜增温。';
    } else if (hasGuan && score < 55) {
      love = '外部压力易带入亲密关系，疲惫时别争论，冷静后再谈。';
    } else if (score >= 70) {
      love = seededPick(CATEGORY_TEMPLATES.love.good, seed + 4);
    } else {
      love = seededPick(CATEGORY_TEMPLATES.love.mid, seed + 4);
    }

    const career = seededPick(pickTemplate(CATEGORY_TEMPLATES.career, score), seed + 6);
    const daily = seededPick(pickTemplate(CATEGORY_TEMPLATES.career, score), seed + 8);

    return [
      { tag: '健康', text: health },
      { tag: '财运', text: wealth },
      { tag: '感情', text: love },
      { tag: '日常', text: `${career} ${daily}`.trim() },
    ];
  }

  function buildLuckExplanations(dayunInfo, layers, refDate) {
    const ty = refDate.getFullYear();
    const tm = refDate.getMonth() + 1;
    const td = refDate.getDate();
    const periodMap = {};

    if (dayunInfo.current) {
      periodMap['大运'] = `${dayunInfo.periodStart}–${dayunInfo.periodEnd} 岁`;
    } else if (dayunInfo.preLuck) {
      periodMap['童限'] = `约 ${Math.ceil(dayunInfo.startAge)} 岁起运`;
    }
    periodMap['流年'] = `${ty} 年`;
    periodMap['流月'] = `${tm} 月`;
    periodMap['流日'] = `${tm} 月 ${td} 日`;

    return layers.map((layer) => ({
      name: layer.layerName,
      pillar: layer.pillar,
      period: periodMap[layer.layerName] || '',
      shishen: layer.shishen || '平和',
      summary: ENERGY_DESC[layer.ganRel] || '对日主影响较为平和。',
      details: layer.effects,
    }));
  }

  function buildEnergyOverview(layers, dmWx) {
    if (!layers || !layers.length) {
      return `案主日主五行属${dmWx}，今日气场平稳。`;
    }
    const total = layers.reduce((s, l) => s + l.score, 0);
    const maxWeight = layers.reduce((s, l) => s + l.weight, 0);
    const avg = total / maxWeight;

    let trend;
    if (avg >= 7) trend = '整体能量偏旺，日主得助较多，可适度进取。';
    else if (avg >= 5.5) trend = '能量平稳，大运流年与流日配合尚可，按常日节奏即可。';
    else if (avg >= 4) trend = '能量略弱，宜先稳后动，减少不必要的消耗与冒险。';
    else trend = '能量受压，今日宜守不宜攻，优先休息与调整状态。';

    const dominant = layers.slice().sort((a, b) => b.score - a.score)[0];
    const caution = layers.filter((l) => l.effects.some((e) => e.includes('冲') || e.includes('刑')));

    const parts = [trend];
    parts.push(`当前以${dominant.layerName}「${dominant.pillar}」影响最为显著（${dominant.shishen}气）。`);
    if (caution.length) {
      parts.push(`今日${caution.map((c) => c.layerName).join('、')}有冲刑动象，重大决定宜缓。`);
    }
    parts.push(`案主日主五行属${dmWx}，以上层级叠加后，构成今日整体气场。`);

    return parts.join('');
  }

  function analyzeDayMaster(userDay, todayPillars, dayunInfo, liunian, liuyue) {
    const dmWx = getWuxingGan(userDay.gan);
    const layers = [];

    if (dayunInfo.current) {
      layers.push(analyzePillarLayer(userDay, dayunInfo.current, '大运', 0.35));
    } else if (dayunInfo.preLuck) {
      layers.push(analyzePillarLayer(userDay, dayunInfo.preLuck, '童限', 0.25));
    }

    layers.push(analyzePillarLayer(userDay, liunian, '流年', 0.30));
    layers.push(analyzePillarLayer(userDay, liuyue, '流月', 0.20));
    layers.push(analyzePillarLayer(userDay, todayPillars.day, '流日', 0.35));

    let score = 55;
    const notes = [];

    layers.forEach((layer) => {
      score += (layer.score / layer.weight - 5) * layer.weight * 2;
      layer.effects.filter((e) => e.includes('合') || e.includes('冲') || e.includes('刑')).forEach((e) => {
        notes.push({ type: 'layer', text: e });
      });
    });

    const dayGanRel = wuxingRelation(dmWx, getWuxingGan(todayPillars.day.gan));

    if (pairMatch(GAN_WUHE, userDay.gan, todayPillars.day.gan)) {
      score += 4;
      notes.push({ type: 'he', text: '流日天干与日主相合，今日易有顺势之机' });
    }
    if (pairMatch(ZHI_LIUCHONG, userDay.zhi, todayPillars.day.zhi)) {
      score -= 6;
      notes.push({ type: 'chong', text: '流日冲日支，动象明显，宜稳不宜冒进' });
    }

    score = Math.max(35, Math.min(95, Math.round(score)));

    return {
      score,
      notes,
      dayGanRel,
      dmWx,
      layers,
      energyOverview: buildEnergyOverview(layers, dmWx),
    };
  }

  function levelFromScore(score) {
    if (score >= 80) return { label: '上吉', cls: 'good' };
    if (score >= 65) return { label: '中吉', cls: 'good' };
    if (score >= 50) return { label: '平稳', cls: '' };
    if (score >= 40) return { label: '稍弱', cls: 'warn' };
    return { label: '宜守', cls: 'warn' };
  }

  function summaryText(score, notes, dayGanRel, energyOverview) {
    const level = levelFromScore(score);
    const parts = [energyOverview];

    if (dayGanRel === '生我') parts.push('流日于日主有生扶，可借力行事。');
    if (dayGanRel === '克我') parts.push('流日官杀感显，注意压力管理与节奏。');
    if (notes.some((n) => n.type === 'chong')) parts.push('逢冲之日，避免冲动决策。');

    return { text: parts.join(''), level };
  }

  const CATEGORY_TEMPLATES = {
    career: {
      title: '事业',
      good: ['思路清晰，适合处理文档、汇报与对接。', '团队协作顺畅，可主动提出想法。', '学习力强，适合充电或整理规划。'],
      mid: ['按部就班完成即可，不宜临时大改方案。', '专注细节，避免多线并行导致疏漏。', '与上级沟通宜简洁明确。'],
      low: ['减少站队与争论，专注本职。', '重要合同、承诺建议复核后再定。', '会议易有分歧，多听少辩。'],
    },
    wealth: {
      title: '财运',
      good: ['正财稳定，小额进账或回款可期。', '理财宜稳健，适合整理账目。', '购物易遇合适之物，但仍需理性。'],
      mid: ['收支平衡，不宜冲动消费。', '投资看长线，短期波动不必焦虑。', '借贷、担保类事务需谨慎。'],
      low: ['守财为上，避免高风险投机。', '大额支出建议延后再议。', '谨防诈骗或冲动转账。'],
    },
    love: {
      title: '感情',
      good: ['单身者易有愉快邂逅，自然相处即可。', '伴侣间宜表达关心，小惊喜增温。', '家人沟通融洽，适合聚餐团聚。'],
      mid: ['保持耐心，勿因小事较真。', '约会、聚会轻松即可，不必刻意。', '给彼此一点空间。'],
      low: ['易因言语误会，说话前先想三秒。', '旧账不宜重翻，冷静后再谈。', '单身者不必急于脱单，先过好自己。'],
    },
    health: {
      title: '健康',
      good: ['精力充沛，适合轻度运动或户外走走。', '作息规律则状态更佳。', '饮食宜清淡，七分饱即可。'],
      mid: ['注意颈椎、用眼，久坐记得起身。', '勿熬夜，保证基本睡眠。', '换季注意添衣。'],
      low: ['情绪易波动，可通过散步、冥想放松。', '少饮酒，肠胃较弱者忌生冷。', '有旧疾者按时复查，勿硬撑。'],
    },
  };

  function pickTemplate(templates, score) {
    if (score >= 70) return templates.good;
    if (score >= 50) return templates.mid;
    return templates.low;
  }

  function seededPick(arr, seed) {
    return arr[Math.abs(seed) % arr.length];
  }

  function buildCategories(score, userBazi, todayBazi) {
    const seed = getGanIndex(userBazi.day.gan) * 7 + getZhiIndex(todayBazi.day.zhi) * 13 + score;
    const categories = [];

    for (const [key, tpl] of Object.entries(CATEGORY_TEMPLATES)) {
      const pool = pickTemplate(tpl, score);
      const offset = key.length * 3;
      const text = seededPick(pool, seed + offset);
      const level = levelFromScore(score + (offset % 5) - 2);
      categories.push({ key, title: tpl.title, text, level });
    }

    return categories;
  }

  function getDailyFortune(userBazi, todayBazi, birth, gender, refDate) {
    const ty = refDate.getFullYear();
    const tm = refDate.getMonth() + 1;
    const td = refDate.getDate();

    const dayunInfo = B.getCurrentDaYun(birth, gender, refDate);
    const liunian = B.getLiuNian(ty, tm, td);
    const liuyue = B.getLiuYue(ty, tm, td);

    const liuri = B.getLiuRi(ty, tm, td);
    const analysis = analyzeDayMaster(userBazi.day, todayBazi, dayunInfo, liunian, liuyue);
    const todayEnergy = buildTodayEnergy(userBazi.day, todayBazi, analysis);
    const personalHint = buildPersonalDailyHint(userBazi, todayBazi, analysis);
    const luckExplanations = buildLuckExplanations(dayunInfo, analysis.layers, refDate);
    const summary = summaryText(analysis.score, analysis.notes, analysis.dayGanRel, analysis.energyOverview);
    const categories = buildCategories(analysis.score, userBazi, todayBazi);

    return {
      score: analysis.score,
      summary: summary.text,
      level: summary.level,
      categories,
      analysis,
      todayEnergy,
      personalHint,
      luckExplanations,
      dayunInfo,
      liunian,
      liuyue,
      liuri,
    };
  }

  window.Fortune = { getDailyFortune, levelFromScore };
})();
