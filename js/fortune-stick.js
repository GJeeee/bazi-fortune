(function () {
  const WUXING = ['木', '火', '土', '金', '水'];
  const SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  const SHENG_BY = { 火: '木', 土: '火', 金: '土', 水: '金', 木: '水' };

  function getConfig() {
    return window.AI_FORTUNE_CONFIG || { workerUrl: '', enabled: false };
  }

  function makeSeed(userBazi, refDate) {
    const d = refDate.toISOString().slice(0, 10);
    const p = `${userBazi.year.gan}${userBazi.year.zhi}${userBazi.day.gan}${userBazi.day.zhi}`;
    let h = 0;
    const s = d + p;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  }

  function stickNumber(seed) {
    return (seed % 100) + 1;
  }

  function analyzePreference(userBazi) {
    const dmWx = Bazi.getWuxingGan(userBazi.day.gan);
    const { percents, counts } = Paipan.calcWuxingPercent(userBazi);
    const selfPower = counts[dmWx] || 0;
    const strength = selfPower >= 3 ? '偏强' : selfPower <= 1 ? '偏弱' : '中和';

    let favored = [];
    if (strength === '偏弱') {
      favored = [SHENG_BY[dmWx], dmWx].filter(Boolean);
    } else if (strength === '偏强') {
      favored = [SHENG[dmWx], WUXING.find((wx) => {
        const ke = { 木: '土', 火: '金', 土: '水', 金: '木', 水: '火' };
        return ke[dmWx] === wx;
      })].filter(Boolean);
    } else {
      favored = [dmWx, SHENG[dmWx]];
    }

    const sorted = WUXING.slice().sort((a, b) => percents[a] - percents[b]);
    const needWx = sorted[0];
    const strongWx = sorted[sorted.length - 1];

    return { dmWx, strength, favored, needWx, strongWx, percents };
  }

  function buildPayload(ctx) {
    const { userBazi, todayBazi, birth, fortune, refDate } = ctx;
    const pref = analyzePreference(userBazi);
    const energy = fortune.todayEnergy || {};
    const seed = makeSeed(userBazi, refDate);

    return {
      mode: 'fortuneStick',
      date: refDate.toISOString().slice(0, 10),
      gender: birth.gender === 'female' ? '女' : '男',
      dayMaster: `${userBazi.day.gan}${pref.dmWx}`,
      userPillars: {
        year: Bazi.formatGanZhi(userBazi.year),
        month: Bazi.formatGanZhi(userBazi.month),
        day: Bazi.formatGanZhi(userBazi.day),
        hour: Bazi.formatGanZhi(userBazi.hour),
      },
      todayDay: Bazi.formatGanZhi(todayBazi.day),
      baziPreference: {
        strength: pref.strength,
        favoredElements: pref.favored,
        needElement: pref.needWx,
        strongElement: pref.strongWx,
        wuxingPercent: pref.percents,
      },
      todayEnergy: {
        positive: energy.positive,
        negative: energy.negative,
        brief: energy.brief,
      },
      score: fortune.score,
      dayGanRelation: fortune.analysis?.dayGanRel,
      stickSeed: seed,
      stickNo: stickNumber(seed),
    };
  }

  const LOCAL_MESSAGES = {
    木: [
      '你其实已经在长，只是还没看见树梢。别急，根扎稳了，风再大也摇不倒你。',
      '今天最想听的，大概是：允许自己慢慢长，不必跟别人的花期比。',
      '你心底那口气还在往上走——有人看见，也有人会在对的时候推你一把。',
    ],
    火: [
      '你的热不是错，只是今天宜收一点焰，把力气留给真正值得的人事物。',
      '你想被理解、被回应——这很正常。先给自己一句「我已经够好了」。',
      '亮着的人也会累。今晚允许自己暗一会儿，明天照样能照到该照的地方。',
    ],
    土: [
      '你扛了太多，今天最想听的或许是：可以放下，天塌不下来。',
      '踏实不是迟钝，是你最稀缺的优点。有人会因这份稳，把要紧事交给你。',
      '别总等万事俱备才动身——你迈半步，路就会长出半步。',
    ],
    金: [
      '你对自己够严了。今天宜松一扣，把「必须完美」换成「已经不错」。',
      '决断力是你的天赋，但此刻最想听的也许是：慢一点，也不会错过命运。',
      '锋芒在，但不必全露。留一点柔软，反而更赢人心。',
    ],
    水: [
      '你想太多不是毛病，是感受力。今天把念头写下来，心就轻一半。',
      '你需要的不是答案，是被好好接住——那就先接住自己。',
      '流动是你的本性。困住时，换个环境、换口气，水自会找到出口。',
    ],
  };

  function localStick(payload) {
    const favored = payload.baziPreference?.favoredElements || ['木'];
    const wx = favored[0] || '木';
    const pool = LOCAL_MESSAGES[wx] || LOCAL_MESSAGES.木;
    const idx = (payload.stickSeed || 0) % pool.length;
    const no = payload.stickNo || stickNumber(payload.stickSeed || 1);
    return {
      stickNo: `第${no}签`,
      message: pool[idx],
    };
  }

  async function fetchStick(payload) {
    const cfg = getConfig();
    if (!cfg.enabled || !cfg.workerUrl) return localStick(payload);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), cfg.timeoutMs || 28000);

    try {
      const res = await fetch(cfg.workerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'fortuneStick', payload }),
        signal: controller.signal,
      });
      if (!res.ok) return localStick(payload);
      const data = await res.json();
      if (data.error) return localStick(payload);
      const raw = data.result || data;
      const msg = typeof raw.message === 'string' ? raw.message.trim() : '';
      if (!msg) return localStick(payload);
      return {
        stickNo: raw.stickNo || `第${payload.stickNo}签`,
        message: msg,
      };
    } catch {
      return localStick(payload);
    } finally {
      clearTimeout(timer);
    }
  }

  function playShakeSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const t = ctx.currentTime;
      for (let i = 0; i < 6; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = 180 + Math.random() * 120;
        const start = t + i * 0.07;
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(0.08, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.06);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.07);
      }
    } catch {
      // ignore
    }
  }

  function bind(options) {
    const btn = options.btn;
    const card = options.card;
    const noEl = options.noEl;
    const msgEl = options.msgEl;
    const getCtx = options.getCtx;
    if (!btn || !card || !getCtx) return;

    let busy = false;

    btn.addEventListener('click', async () => {
      if (busy) return;
      const ctx = getCtx();
      if (!ctx) return;

      busy = true;
      btn.disabled = true;
      btn.classList.remove('stick-revealed');
      btn.classList.add('is-shaking');
      card.classList.add('hidden');
      playShakeSound();

      const payload = buildPayload(ctx);
      const fetchPromise = fetchStick(payload);

      await new Promise((r) => setTimeout(r, 720));

      btn.classList.remove('is-shaking');
      btn.classList.add('stick-revealed');

      const result = await fetchPromise;
      if (noEl) noEl.textContent = result.stickNo;
      if (msgEl) msgEl.textContent = result.message;
      card.classList.remove('hidden');

      busy = false;
      btn.disabled = false;
    });
  }

  window.FortuneStick = { bind, buildPayload, analyzePreference, localStick };
})();
