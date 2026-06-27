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

  function seededPick(arr, seed) {
    if (!arr || !arr.length) return '';
    return arr[Math.abs(seed) % arr.length];
  }

  function makeFortuneSeed(userBazi, todayBazi, birth, refDate, analysis) {
    const ty = refDate.getFullYear();
    const tm = refDate.getMonth() + 1;
    const td = refDate.getDate();
    const hour = birth.hour ?? 11;
    return (
      getGanIndex(userBazi.day.gan) * 37 +
      getZhiIndex(userBazi.day.zhi) * 53 +
      getGanIndex(userBazi.month.gan) * 11 +
      getZhiIndex(userBazi.hour.zhi) * 19 +
      getGanIndex(todayBazi.day.gan) * 23 +
      getZhiIndex(todayBazi.day.zhi) * 29 +
      getGanIndex(todayBazi.month.gan) * 7 +
      getZhiIndex(todayBazi.hour.zhi) * 13 +
      birth.year * 3 +
      birth.month * 5 +
      birth.day * 41 +
      hour * 17 +
      ty * 2 +
      tm * 31 +
      td * 61 +
      refDate.getDay() * 9 +
      Math.round(analysis.score) * 3 +
      (analysis.dayGanRel ? analysis.dayGanRel.charCodeAt(0) : 0)
    );
  }

  function relBoost(rel, posMap, negMap) {
    return { pos: posMap[rel] || 0, neg: negMap[rel] || 0 };
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

  function buildTodayEnergy(userDay, todayBazi, analysis, userFullBazi, birth, refDate) {
    const dmWx = getWuxingGan(userDay.gan);
    let positive = 38;
    let negative = 32;

    const posMap = { 生我: 14, 比和: 10, 我克: 6, 我生: 3, 克我: 0, 平和: 4 };
    const negMap = { 克我: 16, 我生: 8, 比和: 4, 我克: 3, 生我: 0, 平和: 3 };

    const dayGanRel = wuxingRelation(dmWx, getWuxingGan(todayBazi.day.gan));
    const dayZhiRel = wuxingRelation(dmWx, getWuxingZhi(todayBazi.day.zhi));
    const monthGanRel = wuxingRelation(dmWx, getWuxingGan(todayBazi.month.gan));
    const monthZhiRel = wuxingRelation(dmWx, getWuxingZhi(todayBazi.month.zhi));
    const hourGanRel = wuxingRelation(dmWx, getWuxingGan(todayBazi.hour.gan));
    const yearZhiRel = wuxingRelation(dmWx, getWuxingZhi(todayBazi.year.zhi));

    [dayGanRel, dayZhiRel].forEach((rel, i) => {
      const w = i === 0 ? 1 : 0.65;
      positive += relBoost(rel, posMap, negMap).pos * w;
      negative += relBoost(rel, posMap, negMap).neg * w;
    });
    positive += relBoost(monthGanRel, posMap, negMap).pos * 0.35;
    negative += relBoost(monthGanRel, posMap, negMap).neg * 0.35;
    positive += relBoost(monthZhiRel, posMap, negMap).pos * 0.25;
    negative += relBoost(monthZhiRel, posMap, negMap).neg * 0.25;
    positive += relBoost(hourGanRel, posMap, negMap).pos * 0.2;
    negative += relBoost(hourGanRel, posMap, negMap).neg * 0.2;
    positive += relBoost(yearZhiRel, posMap, negMap).pos * 0.15;
    negative += relBoost(yearZhiRel, posMap, negMap).neg * 0.15;

    if (userFullBazi) {
      const birthMonthRel = wuxingRelation(dmWx, getWuxingZhi(userFullBazi.month.zhi));
      const birthHourRel = wuxingRelation(dmWx, getWuxingGan(userFullBazi.hour.gan));
      positive += relBoost(birthMonthRel, posMap, negMap).pos * 0.12;
      negative += relBoost(birthHourRel, posMap, negMap).neg * 0.12;
    }

    analysis.layers.forEach((layer) => {
      if (!layer || !layer.effects) return;
      positive += (relationScore(layer.ganRel) - 5) * layer.weight * 3.2;
      negative += (5 - relationScore(layer.ganRel)) * layer.weight * 2.8;
      positive += (relationScore(layer.zhiRel) - 5) * layer.weight * 1.8;
      negative += (5 - relationScore(layer.zhiRel)) * layer.weight * 1.5;
      layer.effects.forEach((e) => {
        if (e.includes('合')) positive += 4.5 * layer.weight;
        if (e.includes('冲')) negative += 11 * layer.weight;
        if (e.includes('刑')) negative += 6.5 * layer.weight;
      });
    });

    if (pairMatch(GAN_WUHE, userDay.gan, todayBazi.day.gan)) positive += 9;
    if (pairMatch(ZHI_LIUHE, userDay.zhi, todayBazi.day.zhi)) positive += 7;
    if (pairMatch(ZHI_LIUCHONG, userDay.zhi, todayBazi.day.zhi)) negative += 15;
    if (isZhiXing(userDay.zhi, todayBazi.day.zhi)) negative += 9;

    const seed = makeFortuneSeed(userFullBazi || { day: userDay, month: todayBazi.month, hour: todayBazi.hour }, todayBazi, birth, refDate, analysis);
    const jitter = (seed % 23) - 11;
    if (jitter >= 0) positive += jitter * 0.9;
    else negative += Math.abs(jitter) * 0.9;

    const dayIndex = B.getDayPillar(refDate.getFullYear(), refDate.getMonth() + 1, refDate.getDate()).index;
    positive += (dayIndex % 7) * 0.8;
    negative += (dayIndex % 5) * 0.6;

    positive = Math.max(15, Math.min(92, Math.round(positive)));
    negative = Math.max(10, Math.min(88, Math.round(negative)));

    const total = positive + negative;
    let positiveRatio = Math.round((positive / total) * 100);
    positiveRatio = Math.max(28, Math.min(78, positiveRatio));
    const negativeRatio = 100 - positiveRatio;

    return { positive, negative, positiveRatio, negativeRatio };
  }

  const HEALTH_WX_POOL = {
    木: [
      '肝木当令，用眼别过度，午后宜拉伸舒筋。',
      '筋骨宜松，久坐记得起身，少与人硬顶。',
      '风木易动，情绪上来先深呼吸，别急着回消息。',
      '适合轻运动，忌空腹暴走，早餐要吃好。',
      '春木之性，想法多时写下来，别全堆在心里。',
    ],
    火: [
      '心火易旺，咖啡别过量，晚上少刷手机。',
      '睡眠浅的话，睡前半小时别争论。',
      '脸易发热、头易胀，多喝水，少暴晒。',
      '情绪如焰，宜慢半拍再回应，忌一点就燃。',
      '适合午休二十分钟，下午效率会回来。',
    ],
    土: [
      '脾胃主事，午餐别过饱，少冰少辣。',
      '湿土日易困，碳水适量，多走动消食。',
      '思虑多伤脾，琐事别一次想完，分批处理。',
      '腹部宜暖，冷饮能免则免。',
      '适合喝温热的，忌空腹硬扛到半夜。',
    ],
    金: [
      '燥金日，喉咙皮肤易干，补水和防晒要做。',
      '呼吸道敏感，空调房记得加件薄外套。',
      '金气主肃，别对自己太苛刻，放松下颌。',
      '适合通风换气，忌在闷室久坐不动。',
      '早晚温差大，出门多带一层。',
    ],
    水: [
      '肾水主藏，别透支，脚腕和后腰要保暖。',
      '水日易多虑，写下来比反复想有用。',
      '少饮冰，晚间少看刺激内容，利于入睡。',
      '适合泡脚或热水澡，忌熬夜硬撑。',
      '听力与休息相关，噪音大时戴耳机隔绝。',
    ],
  };

  const HEALTH_MOD_POOL = {
    克我: ['官杀压身，肩颈易紧，别连续加班。', '外界要求多，学会说「稍后再办」。', '压力进身体，散步比硬扛有效。'],
    冲: ['逢冲易睡浅，今晚尽量早睡。', '冲日防磕碰，开车走路都看脚下。', '节奏被打乱，别赶，慢即是稳。'],
    刑: ['刑动易纠结，少翻旧账，早休息。', '心里拧巴时，别做重大健康决定。', '内耗日，少刷负面信息。'],
    我生: ['泄气偏重，别空腹硬撑，吃点再忙。', '输出多输入少，今天宜补觉。', '想法太多身体跟不上，减一项待办。'],
    合: ['合日身心较顺，适合体检或理疗。', '合气助力，约朋友运动更容易坚持。', '状态回暖，可把拖久的检查排上。'],
  };

  const WEALTH_POOL = {
    我克: [
      '财星透，小额进账或回款有机会，见好就收。',
      '适合谈价、催款，别在冲动时下单大件。',
      '副业灵感可能有，先验证再投入。',
      '购物易遇心动之物，设个上限再逛。',
      '今日利整理钱包和账单，乱账理清就是财。',
    ],
    生我: [
      '贵人带财信息，适合请教前辈、跟进合作。',
      '学习类投入可能有回报，课程资料值得看。',
      '别人介绍的机会可听，但条款仍要细读。',
      '适合备份重要凭证，电子发票顺手存。',
      '帮别人忙可能带回资源，但别白干。',
    ],
    克我: [
      '开支受牵制，大额消费延后再议。',
      '别在这天签高杠杆协议，保守为上。',
      '钱上宜守，转账前三思，防手滑。',
      '可能有意外支出，留一点备用金。',
      '投资看长线，短期波动别频繁操作。',
    ],
    合: [
      '合财日，合作分成、团购拼单较顺。',
      '适合和老客户联络，回头单有机会。',
      '人情往来可适度，礼数到位即可。',
      '合伙事宜宜面谈，书面确认别省。',
    ],
    default: [
      '收支平常，适合记账而非豪赌。',
      '今天利「整理」而非「扩张」，清掉订阅也省钱。',
      '消费欲一般，需要的东西列清单再买。',
      '现金为王，电子红包别乱发。',
      '适合核对信用卡和自动扣款。',
      '没有大财机，把小钱管好比什么都强。',
    ],
  };

  const LOVE_POOL = {
    合: [
      '合气在，单身易有轻缘，自然相处别表演。',
      '有伴宜表达关心，一顿便饭也能增温。',
      '旧友可能带来桃花信息，别宅。',
      '适合发一条真诚的问候，比冷战强。',
      '约会宜轻松，不必刻意制造惊喜。',
    ],
    冲: [
      '冲日情绪易起波，别在疲惫时争论。',
      '亲密话题缓一缓，换个体面的话题。',
      '单身者易遇「忽冷忽热」，别急着定标签。',
      '有话先冷却三小时，再决定要不要说。',
    ],
    官杀: [
      '外部压力易带进关系，别迁怒身边人。',
      '需要空间就说出来，别用沉默惩罚。',
      '工作气别回家撒，进门先洗脸换气。',
    ],
    食伤: [
      '表达欲强，用温和方式说需求，别吐槽过度。',
      '适合分享趣事，幽默是今天的润滑剂。',
      '创意约会点子不错，拍照、看展都可。',
    ],
    default: [
      '感情节奏平稳，耐心比加速有用。',
      '单身者先过好自己，缘分常在不赶时来。',
      '给彼此一点空间，不必秒回每条消息。',
      '家人通话宜短而暖，别变成审问。',
      '今天利倾听，少说「你应该」。',
      '不必证明被爱，存在本身就够了。',
    ],
  };

  const DAILY_WEEK = [
    '周日宜休整，把下周待办列一列就好。',
    '周一重启模式，先啃最难的那件事。',
    '周二协作顺，适合开会、对接、同步进度。',
    '周三中段，检查一次方向，别盲目前冲。',
    '周四产出日，文档、代码、方案宜收尾。',
    '周五宜收束，能今天结的不拖到周末。',
    '周六弹性大，社交或独处都行，别排太满。',
  ];

  const DAILY_SCENE = [
    '通勤路上听点轻音乐，别一路刷短视频。',
    '工位宜简，清掉三样不用的东西。',
    '邮件宜分批回，别被通知牵着走。',
    '午休走出写字楼十分钟，比多睡更醒神。',
    '会议能短则短，结论写进一句话。',
    '今天适合处理一件拖延已久的小事。',
    '少开新坑，把手头事做完再扩张。',
    '遇到卡壳，问一句比闷头写三小时强。',
    '下班前五分钟复盘，明天会轻松很多。',
    '别在饿或困时做重要决定。',
    '文档命名整理一次，未来会感谢你。',
    '今天利「完成」而非「完美」。',
  ];

  function buildPersonalDailyHint(userBazi, todayBazi, analysis, birth, refDate) {
    const { dmWx, layers, score, dayGanRel } = analysis;
    const seed = makeFortuneSeed(userBazi, todayBazi, birth, refDate, analysis);
    const dayLayer = layers.find((l) => l.layerName === '流日') || layers[layers.length - 1];
    const hasChong = layers.some((l) => l.effects.some((e) => e.includes('冲')));
    const hasXing = layers.some((l) => l.effects.some((e) => e.includes('刑')));
    const hasHe = layers.some((l) => l.effects.some((e) => e.includes('合')));
    const hasGuan = layers.some((l) => l.ganRel === '克我' || l.zhiRel === '克我');
    const caiCount = layers.filter((l) => l.ganRel === '我克' || l.zhiRel === '我克').length;
    const todayGz = formatGanZhi(todayBazi.day);

    let health = seededPick(HEALTH_WX_POOL[dmWx] || HEALTH_WX_POOL.土, seed);
    if (hasGuan) health += ` ${seededPick(HEALTH_MOD_POOL.克我, seed + 1)}`;
    else if (hasChong) health += ` ${seededPick(HEALTH_MOD_POOL.冲, seed + 2)}`;
    else if (hasXing) health += ` ${seededPick(HEALTH_MOD_POOL.刑, seed + 3)}`;
    else if (dayGanRel === '我生') health += ` ${seededPick(HEALTH_MOD_POOL.我生, seed + 4)}`;
    else if (hasHe) health += ` ${seededPick(HEALTH_MOD_POOL.合, seed + 5)}`;

    let wealthPool = WEALTH_POOL.default;
    if (dayGanRel === '我克' || caiCount >= 2) wealthPool = WEALTH_POOL.我克;
    else if (dayGanRel === '生我') wealthPool = WEALTH_POOL.生我;
    else if (dayGanRel === '克我' || hasGuan) wealthPool = WEALTH_POOL.克我;
    else if (hasHe) wealthPool = WEALTH_POOL.合;
    let wealth = seededPick(wealthPool, seed + 7);
    if (caiCount === 1) {
      const ly = layers.find((l) => l.ganRel === '我克' || l.zhiRel === '我克');
      wealth += `（${ly.layerName}财星在位）`;
    }

    let lovePool = LOVE_POOL.default;
    if (hasHe) lovePool = LOVE_POOL.合;
    else if (hasChong) lovePool = LOVE_POOL.冲;
    else if (hasGuan && score < 58) lovePool = LOVE_POOL.官杀;
    else if (dayLayer && dayLayer.shishen === '食伤') lovePool = LOVE_POOL.食伤;
    const love = seededPick(lovePool, seed + 11);

    const weekday = DAILY_WEEK[refDate.getDay()];
    const scene = seededPick(DAILY_SCENE, seed + 13);
    const shishenTip = dayLayer
      ? seededPick(
          [
            `流日${todayGz}偏${dayLayer.shishen}，${scene}`,
            `今日${SHISHEN[dayGanRel] || '平和'}气，${weekday}`,
            `${todayBazi.day.gan}${getWuxingGan(todayBazi.day.gan)}日，${scene}`,
            `流日与你${dayGanRel === '生我' ? '相生' : dayGanRel === '克我' ? '相克' : '中'}，${weekday}`,
          ],
          seed + 17
        )
      : `${weekday} ${scene}`;

    return [
      { tag: '健康', text: health.trim() },
      { tag: '财运', text: wealth },
      { tag: '感情', text: love },
      { tag: '日常', text: shishenTip },
    ];
  }

  function aspectFragments(layer) {
    const { ganRel, zhiRel, shishen, effects } = layer;
    const hasChong = effects.some((e) => e.includes('冲'));
    const hasXing = effects.some((e) => e.includes('刑'));
    const hasHe = effects.some((e) => e.includes('合'));

    let health;
    if (ganRel === '克我' || zhiRel === '克我') health = '别硬扛，睡眠和肠胃要顾好';
    else if (hasChong) health = '易波动，少熬夜、防磕碰';
    else if (hasXing) health = '少内耗，别把小情绪放大';
    else if (ganRel === '我生' || zhiRel === '我生') health = '消耗快，宜劳逸结合';
    else if (ganRel === '生我' || zhiRel === '生我') health = '底气尚可，作息规律就好';
    else health = '整体平稳，按平时习惯即可';

    let wealth;
    if (ganRel === '我克' || zhiRel === '我克') wealth = '有小财机，宜稳不宜赌';
    else if (hasChong) wealth = '账目易变，合同转账多核对';
    else if (ganRel === '克我') wealth = '开支受制，守财为上';
    else if (ganRel === '生我' || zhiRel === '生我') wealth = '适合整理账目、跟进回款';
    else wealth = '平常，别贪快钱';

    let emotion;
    if (hasHe) emotion = '温度不错，有话宜说';
    else if (hasChong) emotion = '易起波，别在气头上争';
    else if (hasXing) emotion = '易反复，旧账别翻';
    else if (shishen === '官杀' || ganRel === '克我') emotion = '别全闷心里，找人聊聊';
    else if (shishen === '食伤') emotion = '感受丰富，宜温和表达';
    else emotion = '节奏平稳，耐心真诚即可';

    let social;
    if (hasHe) social = '较顺，宜主动联络合作';
    else if (hasChong) social = '易有摩擦，少说多听';
    else if (hasXing) social = '防口舌，讨论温和些';
    else if (ganRel === '比和' || zhiRel === '比和') social = '同频者多，团队效率高';
    else if (ganRel === '生我' || zhiRel === '生我') social = '易遇帮扶，多向前辈请教';
    else social = '平常，先把身边关系维护好';

    return { health, wealth, emotion, social };
  }

  function addDays(y, m, d, delta) {
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + delta);
    return { y: dt.getFullYear(), m: dt.getMonth() + 1, d: dt.getDate() };
  }

  function getDayunIndex(dayunInfo) {
    if (!dayunInfo.current) return -1;
    return dayunInfo.list.findIndex((d) => d.index === dayunInfo.current.index);
  }

  function narrativeTrend(layer) {
    const { ganRel, shishen, effects } = layer;
    if (effects.some((e) => e.includes('冲'))) return '变动多、定下来难';
    if (effects.some((e) => e.includes('刑'))) return '心里易拧巴、口舌要小心';
    if (effects.some((e) => e.includes('合'))) return '人缘机缘都活，合作容易成';
    if (ganRel === '生我') return '常有人拉一把、帮一把';
    if (ganRel === '克我') return '压力常伴，但也催人长进';
    if (ganRel === '我克' || shishen === '财星') return '钱和具体事务占大头';
    if (shishen === '食伤') return '话多、想法多、表达欲旺';
    if (ganRel === '比和') return '同辈竞争、比较心会冒出来';
    return '说不上大起大落，按部就班';
  }

  function narrativeLife(layer, seed) {
    const { wealth, emotion, social } = aspectFragments(layer);
    const opts = [
      `${wealth}，${emotion}`,
      `手头${wealth}，感情上${emotion}`,
      `${wealth}；${social}`,
    ];
    return seededPick(opts, seed);
  }

  function buildNaturalTimeline(userDay, layerName, dayunInfo, refDate, currentLayer) {
    const ty = refDate.getFullYear();
    const tm = refDate.getMonth() + 1;
    const td = refDate.getDate();
    const seed = getGanIndex(userDay.gan) * 17 + getZhiIndex(userDay.zhi) * 7 + layerName.charCodeAt(0);
    const parts = [];

    if (layerName === '大运' || layerName === '童限') {
      const idx = getDayunIndex(dayunInfo);
      const startAge = Math.floor(dayunInfo.startAge);
      const curGz = currentLayer.pillar;

      if (idx > 0) {
        const prev = dayunInfo.list[idx - 1];
        const pl = analyzePillarLayer(userDay, prev, '大运', 1);
        const gz = formatGanZhi(prev);
        const from = startAge + (idx - 1) * 10;
        const to = from + 10;
        const nt = narrativeTrend(pl);
        const nl = narrativeLife(pl, seed);
        parts.push(
          seededPick(
            [
              `${from}岁到${to}岁那程${gz}运，${nt}，${nl}，为如今这步${curGz}运埋下了底子。`,
              `上一个大运走${gz}（${from}–${to}岁），${nt}，${nl}，你现在踩到的节奏，不少从那里延续而来。`,
              `${gz}运的十年里，${nt}，${nl}，像给现在的${curGz}运写好了序章。`,
            ],
            seed
          )
        );
      } else if (layerName === '童限') {
        parts.push(
          seededPick(
            [
              '还没正式起运之前，家庭与环境的烙印最深，是后面故事的起点。',
              '幼年少年的底色，多半藏在起运前的节拍里。',
            ],
            seed
          )
        );
      } else if (idx === 0) {
        parts.push(
          seededPick(
            [
              '童限里打下的根基，仍会在眼下这步大运里时时显形。',
              '早年种下的因，在这步运里慢慢显山露水。',
            ],
            seed
          )
        );
      }

      if (dayunInfo.current && idx >= 0 && idx < dayunInfo.list.length - 1) {
        const next = dayunInfo.list[idx + 1];
        const nl = analyzePillarLayer(userDay, next, '大运', 1);
        const gz = formatGanZhi(next);
        const from = startAge + (idx + 1) * 10;
        const yearsLeft = Math.max(1, Math.ceil(dayunInfo.periodEnd - dayunInfo.age));
        const nt = narrativeTrend(nl);
        const life = narrativeLife(nl, seed + 3);
        parts.push(
          seededPick(
            [
              `大约${yearsLeft}年后，气场会切到${gz}运（${from}–${from + 10}岁），${nt}，${life}，可提早留点心理准备。`,
              `下一程大运是${gz}，约${yearsLeft}年后来接棒，${nt}，${life}。`,
              `再往后走，${gz}运在${from}岁前后等着（还有约${yearsLeft}年），${nt}，${life}。`,
            ],
            seed + 3
          )
        );
      } else if (!dayunInfo.current && dayunInfo.list[0]) {
        const next = dayunInfo.list[0];
        const nl = analyzePillarLayer(userDay, next, '大运', 1);
        const gz = formatGanZhi(next);
        const from = Math.ceil(dayunInfo.startAge);
        parts.push(
          seededPick(
            [
              `${from}岁前后入${gz}大运，${narrativeTrend(nl)}，${narrativeLife(nl, seed + 5)}，童限的节拍会由此换挡。`,
              `再过不久就进${gz}运（约${from}岁起），${narrativeTrend(nl)}，${narrativeLife(nl, seed + 5)}。`,
            ],
            seed + 5
          )
        );
      }
    }

    if (layerName === '流年') {
      const prev = B.getLiuNian(ty - 1, tm, td);
      const next = B.getLiuNian(ty + 1, tm, td);
      const pl = analyzePillarLayer(userDay, prev, '流年', 1);
      const nl = analyzePillarLayer(userDay, next, '流年', 1);
      const pgz = formatGanZhi(prev);
      const ngz = formatGanZhi(next);
      parts.push(
        seededPick(
          [
            `${ty - 1}年${pgz}的节奏，${narrativeTrend(pl)}，${narrativeLife(pl, seed)}，是今年运势的来路。`,
            `去年${pgz}年${narrativeTrend(pl)}，${narrativeLife(pl, seed)}，很多惯性延续到了${ty}。`,
            `${pgz}年的那套节拍还没走远，${narrativeTrend(pl)}，${narrativeLife(pl, seed)}，给${ty}年垫了底。`,
          ],
          seed
        )
      );
      parts.push(
        seededPick(
          [
            `顺着时间轴，${ty + 1}年${ngz}一到，${narrativeTrend(nl)}，${narrativeLife(nl, seed + 5)}。`,
            `明年走${ngz}，${narrativeTrend(nl)}，${narrativeLife(nl, seed + 5)}，有些事可提前铺排。`,
            `再往前一步是${ngz}年，${narrativeTrend(nl)}，${narrativeLife(nl, seed + 5)}，心里有个数就不慌。`,
          ],
          seed + 5
        )
      );
    }

    if (layerName === '流月') {
      const prevM = tm === 1 ? { y: ty - 1, m: 12 } : { y: ty, m: tm - 1 };
      const nextM = tm === 12 ? { y: ty + 1, m: 1 } : { y: ty, m: tm + 1 };
      const prev = B.getLiuYue(prevM.y, prevM.m, 15);
      const next = B.getLiuYue(nextM.y, nextM.m, 15);
      const pl = analyzePillarLayer(userDay, prev, '流月', 1);
      const nl = analyzePillarLayer(userDay, next, '流月', 1);
      const pgz = formatGanZhi(prev);
      const ngz = formatGanZhi(next);
      parts.push(
        seededPick(
          [
            `${prevM.m}月${pgz}的气还在，${narrativeTrend(pl)}，本月是在其延伸上微调。`,
            `上个月走${pgz}，${narrativeTrend(pl)}，给这月垫了一层底色。`,
          ],
          seed
        )
      );
      parts.push(
        seededPick(
          [
            `进入${nextM.m}月后${ngz}当头，${narrativeTrend(nl)}，${narrativeLife(nl, seed + 3)}。`,
            `往下数${nextM.m}月接${ngz}，${narrativeTrend(nl)}，${narrativeLife(nl, seed + 3)}，不妨心里有数。`,
          ],
          seed + 3
        )
      );
    }

    if (layerName === '流日') {
      const prevD = addDays(ty, tm, td, -1);
      const nextD = addDays(ty, tm, td, 1);
      const prev = B.getLiuRi(prevD.y, prevD.m, prevD.d);
      const next = B.getLiuRi(nextD.y, nextD.m, nextD.d);
      const pl = analyzePillarLayer(userDay, prev, '流日', 1);
      const nl = analyzePillarLayer(userDay, next, '流日', 1);
      const pgz = formatGanZhi(prev);
      const ngz = formatGanZhi(next);
      parts.push(
        seededPick(
          [
            `昨天${pgz}的余温还在，${narrativeTrend(pl)}，今日在其上叠加。`,
            `前一日${pgz}那股劲还没散尽，${narrativeTrend(pl)}，今天算是接着写。`,
          ],
          seed
        )
      );
      parts.push(
        seededPick(
          [
            `明天换成${ngz}，${narrativeTrend(nl)}，行程宜略作调整。`,
            `下一日${ngz}接棒，${narrativeTrend(nl)}，今晚不妨早做打算。`,
          ],
          seed + 3
        )
      );
    }

    return parts.join('');
  }

  function buildLayerRisk(layer, layerName) {
    const { ganRel, zhiRel, effects } = layer;
    const risks = [];

    if (effects.some((e) => e.includes('冲'))) {
      risks.push('逢冲，忌冲动签约、远行或重大转向');
    }
    if (effects.some((e) => e.includes('刑'))) {
      risks.push('刑动，防口舌是非与反复内耗');
    }
    if (ganRel === '克我' || zhiRel === '克我') {
      risks.push('压力上行，忌硬扛、过度加班');
    }
    if (ganRel === '我生' && zhiRel === '我生') {
      risks.push('泄气偏重，忌熬夜透支');
    }
    if ((ganRel === '我克' || zhiRel === '我克') && layerName === '大运') {
      risks.push('财机伴随诱惑，忌贪快、高杠杆');
    }
    if (layerName === '流年' && effects.some((e) => e.includes('冲'))) {
      risks.push('流年逢冲，工作变动、搬迁类决定宜三思');
    }
    if (layerName === '流日' && effects.some((e) => e.includes('冲'))) {
      risks.push('流日冲日支，当日忌意气用事');
    }

    if (!risks.length) {
      const defaults = {
        大运: '十年气运宜分步推进，忌一口吃成胖子。',
        流年: '全年节奏宜留弹性，忌一次押满所有筹码。',
        流月: '本月小事可快、大事宜慢，忌把局面拖僵。',
        流日: '今日精力有限，忌硬扛加班、忌冲动表态。',
        童限: '起运前宜稳字当先，忌过度折腾。',
      };
      return defaults[layerName] || '做事留一步回旋余地。';
    }
    return risks.slice(0, 2).join('；') + '。';
  }

  function buildLayerPlainSummary(layer) {
    const { health, wealth, emotion, social } = aspectFragments(layer);
    return `身体${health}，钱上${wealth}，感情${emotion}，与人相处${social}。`;
  }

  function buildLayerTechnicalNote(layer) {
    const { pillar, shishen, ganRel, zhiRel, effects } = layer;
    const ganTerm = {
      比和: '比劫比和',
      生我: '印绶生身',
      克我: '官杀制身',
      我生: '食伤泄秀',
      我克: '财星耗身',
      平和: '气场中和',
    };
    const zhiTerm = {
      比和: '地支同气',
      生我: '地支生扶',
      克我: '地支施压',
      我生: '地支泄气',
      我克: '地支为财',
      平和: '地支平和',
    };

    const mods = [];
    if (effects.some((e) => e.includes('相合') || e.includes('六合'))) mods.push('合');
    if (effects.some((e) => e.includes('相冲'))) mods.push('冲');
    if (effects.some((e) => e.includes('相刑'))) mods.push('刑');
    const modStr = mods.length ? `，带${[...new Set(mods)].join('')}象` : '';

    return `${pillar}：十神${shishen}，${ganTerm[ganRel] || '天干平和'}，${zhiTerm[zhiRel] || '地支影响轻'}${modStr}。`;
  }

  function buildLayerExplanation(layer, userDay, dayunInfo, refDate) {
    const timeline = buildNaturalTimeline(userDay, layer.layerName, dayunInfo, refDate, layer);
    return {
      plain: `当下，${buildLayerPlainSummary(layer)}`,
      timeline,
      risk: buildLayerRisk(layer, layer.layerName),
      technical: buildLayerTechnicalNote(layer),
    };
  }

  function buildLuckExplanations(dayunInfo, layers, userDay, refDate) {
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

    return layers.map((layer) => {
      const { plain, timeline, risk, technical } = buildLayerExplanation(layer, userDay, dayunInfo, refDate);
      return {
        name: layer.layerName,
        pillar: layer.pillar,
        period: periodMap[layer.layerName] || '',
        plain,
        timeline,
        risk,
        technical,
      };
    });
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

  function buildCategories(score, userBazi, todayBazi, birth, refDate, analysis) {
    const seed = makeFortuneSeed(userBazi, todayBazi, birth, refDate, analysis);
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
    const todayEnergy = buildTodayEnergy(userBazi.day, todayBazi, analysis, userBazi, birth, refDate);
    const personalHint = buildPersonalDailyHint(userBazi, todayBazi, analysis, birth, refDate);
    const luckExplanations = buildLuckExplanations(dayunInfo, analysis.layers, userBazi.day, refDate);
    const summary = summaryText(analysis.score, analysis.notes, analysis.dayGanRel, analysis.energyOverview);
    const categories = buildCategories(analysis.score, userBazi, todayBazi, birth, refDate, analysis);

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
