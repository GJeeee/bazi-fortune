(function () {
  const CONTRASTS_BY_WX = {
    木: [
      { mask: '脾气很好、很好说话的老好人', truth: '一旦触及底线就会默默拉远全世界的硬骨头' },
      { mask: '看起来佛系随缘的慢热派', truth: '心里早就写好了一份人生优先级清单' },
      { mask: '温和不争的和平主义者', truth: '比谁都清楚自己要什么、只是不想浪费口水' },
    ],
    火: [
      { mask: '雷厉风行的行动派', truth: '需要被肯定的细节控' },
      { mask: '自带聚光灯的社交 C 位', truth: '深夜会反复回放白天每一句对话的人' },
      { mask: '看起来什么都不怕的冲劲王', truth: '其实很怕让在意的人失望' },
    ],
    土: [
      { mask: '稳重靠谱、让人安心的定海神针', truth: '私下会把所有担心都自己消化完' },
      { mask: '看起来慢半拍的务实派', truth: '内心戏比连续剧还丰富' },
      { mask: '不爱表达情绪的「没事啦」选手', truth: '最需要有人主动问一句「你还好吗」' },
    ],
    金: [
      { mask: '冷静果断、说一不二的狠角色', truth: '对亲近的人会偷偷把标准降到地板' },
      { mask: '看起来刀枪不入的原则派', truth: '一句「你辛苦了」就能破防一整晚' },
      { mask: '效率至上的理性主义者', truth: '比谁都渴望被温柔地对待' },
    ],
    水: [
      { mask: '随和通透、什么都能聊的社牛', truth: '情绪像海绵一样吸走了太多别人的压力' },
      { mask: '看起来云淡风轻的佛系玩家', truth: '脑子里的复盘会议从不停歇' },
      { mask: '善解人意、永远先照顾别人的人', truth: '最需要学会把「我」字说出口' },
    ],
  };

  const SHISHEN_TWIST = {
    七杀: '遇强则强，但你也值得被好好心疼',
    正官: '扛责任扛习惯了，偶尔摆烂不丢人',
    食神: '看起来好说话，其实审美和底线都很高',
    伤官: '嘴硬心软，创意是你最私密的避风港',
    偏财: '机会嗅觉灵敏，但也别总把自己当永动机',
    正财: '精打细算不是抠，是在给未来的自己攒底气',
    比肩: '独立是你的铠甲，求助也是一项技能',
    劫财: '竞争心是你的燃料，休息也是战略',
    偏印: '脑洞很大，只是还没找到同频的人',
    正印: '好学内省，但别把所有答案都往自己身上揽',
  };

  function seedFromBazi(bazi) {
    const s = `${bazi.year.gan}${bazi.year.zhi}${bazi.day.gan}${bazi.day.zhi}${bazi.hour.gan}${bazi.hour.zhi}`;
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  }

  function dominantShishen(bazi) {
    if (!window.Paipan) return null;
    const chart = Paipan.buildPaipanChart(bazi);
    const counts = {};
    chart.forEach((col) => {
      [col.ganShishen, col.zhiShishen].forEach((ss) => {
        if (ss && ss !== '日主') counts[ss] = (counts[ss] || 0) + 1;
      });
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || null;
  }

  function build(bazi, aiPersonality) {
    if (typeof aiPersonality === 'string') {
      const m = aiPersonality.match(/别人以为你(.+?)，(?:但|其实)你(?:内心|其实)(?:是个|是)(.+?)[。！]/);
      if (m) {
        return `别人以为你是${m[1].trim()}，但其实你内心是个${m[2].trim()}。`;
      }
    }

    const dmWx = Bazi.getWuxingGan(bazi.day.gan);
    const pool = CONTRASTS_BY_WX[dmWx] || CONTRASTS_BY_WX.土;
    const pick = pool[seedFromBazi(bazi) % pool.length];
    let line = `别人以为你是${pick.mask}，但其实你内心是个${pick.truth}。`;

    const ss = dominantShishen(bazi);
    if (ss && SHISHEN_TWIST[ss] && seedFromBazi(bazi) % 3 === 0) {
      line = `${line.slice(0, -1)}——${SHISHEN_TWIST[ss]}。`;
    }

    return line;
  }

  window.EmpathyCopy = { build };
})();
