(function () {
  const WUXING_ORDER = ['木', '火', '土', '金', '水'];
  const SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  const KE = { 木: '土', 火: '金', 土: '水', 金: '木', 水: '火' };

  const RELATION_LABELS = {
    romance: '异性情缘',
    friend: '闺蜜/基友',
    work: '事业伙伴',
  };

  const LEVELS = [
    { min: 85, label: '天作之合', tagline: '气场很合拍，相处自带 buff' },
    { min: 72, label: '细水长流', tagline: '稳稳的类型，越处越有默契' },
    { min: 58, label: '欢喜冤家', tagline: '有火花也有磨合，记得互相留余地' },
    { min: 48, label: '互相打磨型', tagline: '差异明显，但也能一起成长' },
    { min: 0, label: '需要多一份耐心', tagline: '节奏不同步，慢下来反而更长久' },
  ];

  const WX_PERSONA = {
    木: { tag: '向上派', trait: '有点主见、脚步不停' },
    火: { tag: '行动派', trait: '风风火火、想到就做' },
    土: { tag: '靠谱型', trait: '踏实能扛、节奏偏稳' },
    金: { tag: '细节控', trait: '内心有分寸、做事讲条理' },
    水: { tag: '感受派', trait: '心思细、适应力很强' },
  };

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function getDmWx(bazi) {
    return Bazi.getWuxingGan(bazi.day.gan);
  }

  function getWxRelation(a, b) {
    if (a === b) return { type: '比和', label: '同气相求', tone: 'warm' };
    if (SHENG[a] === b) return { type: '我生', label: '你带 TA 升温', tone: 'warm' };
    if (SHENG[b] === a) return { type: '生我', label: 'TA 是你的充电宝', tone: 'warm' };
    if (KE[a] === b) return { type: '我克', label: '你更容易主导节奏', tone: 'spark' };
    if (KE[b] === a) return { type: '克我', label: 'TA 常推你一把', tone: 'spark' };
    return { type: '平和', label: '各有主场', tone: 'neutral' };
  }

  function pickLevel(score) {
    return LEVELS.find((l) => score >= l.min) || LEVELS[LEVELS.length - 1];
  }

  function calcComplementScore(userPct, partnerPct) {
    let bonus = 0;
    WUXING_ORDER.forEach((wx) => {
      const u = userPct[wx] || 0;
      const p = partnerPct[wx] || 0;
      if (u <= 10 && p >= 18) bonus += 4;
      else if (p <= 10 && u >= 18) bonus += 3;
    });
    return Math.min(bonus, 16);
  }

  function buildPortrait(userDm, userWx, partnerDm, partnerWx, partnerName) {
    const me = WX_PERSONA[userWx] || WX_PERSONA.土;
    const ta = WX_PERSONA[partnerWx] || WX_PERSONA.土;
    const name = partnerName || 'TA';
    return `你是那种${me.trait}的「${me.tag}」${userDm}${userWx}，而 ${name} 更像${ta.trait}、${ta.tag === '细节控' ? '有点慢热' : '节奏自有章法'}的「${ta.tag}」${partnerDm}${partnerWx}。`;
  }

  function buildMetaphor(relation, rel, partnerName, score) {
    const name = partnerName || 'TA';
    const pools = {
      romance: {
        warm: [
          `你们俩凑一块，简直就是「火锅配冰粉」——一热一凉，意外地解腻又过瘾。`,
          `你和 ${name} 像「早咖啡配夜宵」——时间点不同，但彼此都能补那一口。`,
          `这组合像「晴天遇伞」——不一定天天用，关键时刻特别安心。`,
        ],
        spark: [
          `你俩有点像「火锅碰冷饮」——火花不缺，记得给彼此留点降温时间。`,
          `像「急性子遇上慢吞吞」——一个催进度一个抠细节，凑齐了才完整。`,
          `你们是「互相点火也互相灭火」那挂，吵完往往更能说清楚。`,
        ],
        neutral: [
          `你们不是复制粘贴的同款，更像「拼盘」——各取所长，桌才丰盛。`,
          `像两种不同步的节拍，练熟了就是专属双人舞。`,
        ],
      },
      friend: {
        warm: [
          `你俩属于「一约就出门」的配置，吐槽和八卦都能接得住。`,
          `像「奶茶配炸鸡」——不健康但快乐，见面就是充电。`,
          `凑一起就是「废话输出机」，认真事也能说到点子上。`,
        ],
        spark: [
          `互怼是日常，像「相声搭子」——嘴硬心软那种。`,
          `观点撞车时不稀奇，像「辩论赛队友」——吵完还能一起吃饭。`,
          `你俩一个直给一个慢热，像「火机配蜡烛」，点着就亮。`,
        ],
        neutral: [
          `各忙各的也能处，像「云好友」——不黏但关键时刻在。`,
          `见面不多，但每次都像「续费情绪价值」。`,
        ],
      },
      work: {
        warm: [
          `搭伙搞钱像「油门配刹车」——一个冲一个稳，项目不容易翻。`,
          `你俩像「脑暴配落地」——想法有人接，执行有人盯。`,
          `合作起来是「1+1>2」的工位邻居，沟通成本不高。`,
        ],
        spark: [
          `节奏不同步时像「双线程跑项目」——对齐一下就能提速。`,
          `一个要快一个要细，像「速写配精修」，别互相嫌弃。`,
          `开会容易各说各话，像「两个频道」——定个主持人就顺了。`,
        ],
        neutral: [
          `各擅一块，像「拼图两块」——拼上才看全图。`,
          `协作像「接力赛」，交棒清楚就不掉链子。`,
        ],
      },
    };
    const tone = rel.tone === 'warm' ? 'warm' : rel.tone === 'spark' ? 'spark' : 'neutral';
    const list = pools[relation]?.[tone] || pools.friend.neutral;
    return list[score % list.length];
  }

  function buildPracticalTip(relation, rel, partnerName) {
    const name = partnerName || 'TA';
    const tips = {
      romance: {
        warm: `相处不用演完美，偶尔说「今天我想自己待会儿」不是冷淡，是给关系透气；你也值得被好好对待。`,
        spark: `吵架时别急着讲道理，你俩都在气头上时，不如先各自去刷半小时手机，等那股劲儿过了再聊，效率翻倍。`,
        neutral: `别猜 ${name} 的心思，直接说「我需要什么」比绕弯子省力气，你也轻松。`,
      },
      friend: {
        warm: `约饭那两小时尽量别全程刷手机，面对面吐槽一次，比连发十条语音更解压。`,
        spark: `互怼完请杯奶茶就算和好了，别在群聊里让 ${name} 下不来台——私聊讲真话更体面。`,
        neutral: `不用天天联系，但好事坏事都记得@${name} 一下，友情靠「被想起」续费。`,
      },
      work: {
        warm: `开会对齐 10 分钟，胜过扯皮 1 小时；分工写清楚，比口头默契更护你的下班时间。`,
        spark: `邮件别硬刚，语音 3 分钟通常更省事；卡点谁拍板提前说好，你不该为模糊背锅。`,
        neutral: `用文档留痕不是不信任，是保护你俩的精力——「我以为你知道」最耗人。`,
      },
    };
    const tone = rel.tone === 'warm' ? 'warm' : rel.tone === 'spark' ? 'spark' : 'neutral';
    return tips[relation]?.[tone] || tips.friend.neutral;
  }

  function calculate(userBazi, partnerBazi, relation, partnerName) {
    const userDm = userBazi.day.gan;
    const partnerDm = partnerBazi.day.gan;
    const userDmWx = getDmWx(userBazi);
    const partnerDmWx = getDmWx(partnerBazi);
    const rel = getWxRelation(userDmWx, partnerDmWx);

    const { percents: userPct } = Paipan.calcWuxingPercent(userBazi);
    const { percents: partnerPct } = Paipan.calcWuxingPercent(partnerBazi);
    const bonus = calcComplementScore(userPct, partnerPct);

    let score = 66;
    if (rel.type === '比和') score += 14;
    else if (rel.type === '生我') score += 12;
    else if (rel.type === '我生') score += 8;
    else if (rel.type === '我克' || rel.type === '克我') score -= 2;
    score += bonus;
    score += relation === 'romance' && rel.tone === 'warm' ? 3 : 0;
    score += relation === 'work' && rel.type === '比和' ? 4 : 0;
    score = clamp(Math.round(score), 48, 96);

    const level = pickLevel(score);
    const narrative = {
      portrait: buildPortrait(userDm, userDmWx, partnerDm, partnerDmWx, partnerName),
      metaphor: buildMetaphor(relation, rel, partnerName, score),
      tip: buildPracticalTip(relation, rel, partnerName),
    };

    return {
      score,
      level: level.label,
      tagline: level.tagline,
      relation,
      relationLabel: RELATION_LABELS[relation] || '',
      partnerName: partnerName || 'TA',
      userLabel: `${userDm}${userDmWx}`,
      partnerLabel: `${partnerDm}${partnerDmWx}`,
      wxRelation: rel,
      userPercents: userPct,
      partnerPercents: partnerPct,
      narrative,
      adviceMain: narrative.metaphor,
      adviceExtra: narrative.tip,
    };
  }

  window.Hepan = {
    calculate,
    RELATION_LABELS,
  };
})();
