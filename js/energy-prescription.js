(function () {
  const WUXING = ['木', '火', '土', '金', '水'];

  const PRESCRIPTIONS = {
    木: {
      yi: '出门散散步、给房间换束花，让脑子透透气',
      ji: '把自己逼太紧、在一件事上死磕到底',
    },
    火: {
      yi: '去运动出汗、吃顿甜品犒劳自己',
      ji: '和老板硬刚、在气头上发长语音',
    },
    土: {
      yi: '好好吃顿饭、把待办划掉一件就收工',
      ji: '反复纠结同一件事、熬夜刷手机',
    },
    金: {
      yi: '列个清单打掉一件事、给自己一个清晰截止',
      ji: '话说到太满、对亲近的人太苛刻',
    },
    水: {
      yi: '听一首轻音乐、早点下班泡个热水澡',
      ji: '过度内耗、把别人的情绪全背自己身上',
    },
  };

  const TAB_TITLES = {
    liuri: '今日能量处方',
    liuyue: '本月能量处方',
    liunian: '今年能量处方',
    dayun: '大运能量处方',
  };

  function countWx(bazi) {
    const counts = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    if (!bazi) return counts;
    const pillars = [bazi.day, bazi.month].filter(Boolean);
    pillars.forEach((p) => {
      if (p.gan) counts[Bazi.getWuxingGan(p.gan)] += 1;
      if (p.zhi) counts[Bazi.getWuxingZhi(p.zhi)] += 1;
    });
    return counts;
  }

  function dominantWx(counts) {
    return WUXING.slice().sort((a, b) => (counts[b] || 0) - (counts[a] || 0))[0] || '土';
  }

  function wxForTab(tabKey, refDate, userBazi, ex) {
    if (tabKey === 'liuri' && refDate) {
      const today = Bazi.calculateBazi(
        refDate.getFullYear(),
        refDate.getMonth() + 1,
        refDate.getDate(),
        12
      );
      return dominantWx(countWx(today));
    }
    if (tabKey === 'liuyue' && ex?.pillar) {
      const gan = ex.pillar.charAt(0);
      const zhi = ex.pillar.charAt(1);
      return dominantWx(countWx({ day: { gan, zhi }, month: { gan, zhi } }));
    }
    if ((tabKey === 'liunian' || tabKey === 'dayun') && ex?.pillar) {
      const gan = ex.pillar.charAt(0);
      const zhi = ex.pillar.charAt(1);
      return Bazi.getWuxingGan(gan) || Bazi.getWuxingZhi(zhi);
    }
    if (userBazi) {
      const { percents } = Paipan.calcWuxingPercent(userBazi);
      return WUXING.slice().sort((a, b) => percents[b] - percents[a])[0];
    }
    return '土';
  }

  function build(tabKey, refDate, userBazi, ex) {
    const wx = wxForTab(tabKey, refDate, userBazi, ex);
    const copy = PRESCRIPTIONS[wx] || PRESCRIPTIONS.土;
    return {
      wx,
      title: TAB_TITLES[tabKey] || TAB_TITLES.liuri,
      yi: copy.yi,
      ji: copy.ji,
    };
  }

  window.EnergyPrescription = { build, PRESCRIPTIONS };
})();
