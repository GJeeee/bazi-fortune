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

  function pickStickLabel() {
    const labels = [
      '上签',
      '上上签',
      '超级牛逼签',
      '一飞冲天签',
      '锦鲤附体签',
      '欧皇降临签',
      '躺赢签',
      '天选之子签',
      '鸿运当头签',
      '吉星高照签',
      '喜气洋洋签',
      '财源滚滚签',
      '桃花朵朵签',
      '王者归来签',
      '开挂签',
      '好运加满签',
      '宇宙偏爱签',
      '凡尔赛签',
      '顺风顺水签',
      '心想事成签',
    ];
    return labels[Math.floor(Math.random() * labels.length)];
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
      stickLabelExamples: [
        '上签', '上上签', '超级牛逼签', '一飞冲天签', '锦鲤附体签', '欧皇降临签', '躺赢签',
      ],
    };
  }

  const LOCAL_MESSAGES = {
    木: [
      '风也摇树我不摇，躺平日头节节高。',
      '根在土里心在飘，今日宜疯明日再潮。',
      '东边种豆西边长，抽象一点也风光。',
    ],
    火: [
      '火焰往上蹿，锅里有神仙，你且别慌张，吉运正猖狂。',
      '太阳晒头皮，反光照玻璃，签文说不明，贵气自然至。',
      '热情烧过火，好事排队摸，今天宜得瑟，明天更洒脱。',
    ],
    土: [
      '土厚能埋金，莫怕路没灯，走一步算一步，财神在后头跟。',
      '饼画得够圆，日子就不颠，稳住你能赢，别跟风瞎转。',
      '脚踏实地走，天上掉块肉，抽象归抽象，福运在招手。',
    ],
    金: [
      '金币叮叮当，主意硬邦邦，今天宜嘴硬，明日就称王。',
      '刀锋藏袖里，笑里藏吉利，签文整一句，贵气自然至。',
      '金声玉振时，躺赢也不迟，你且信此签，好事正当时。',
    ],
    水: [
      '水往低处流，好运往你兜，别问为啥，问就是牛。',
      '浪大别晕船，浮浮沉又沉，抽象一下呗，吉运正登门。',
      '流水不争先，偏偏到你前，今日宜摸鱼，明日变锦鲤。',
    ],
  };

  function localStick(payload) {
    const favored = payload.baziPreference?.favoredElements || ['木'];
    const wx = favored[0] || '木';
    const pool = LOCAL_MESSAGES[wx] || LOCAL_MESSAGES.木;
    const idx = (payload.stickSeed || 0) % pool.length;
    return {
      stickNo: pickStickLabel(),
      message: pool[idx],
    };
  }

  function formatPoemLines(text) {
    const cleaned = text.replace(/[。！？\s]/g, '').trim();
    if (!cleaned) return ['', ''];

    const parts = cleaned.split(/[，,、]/).filter(Boolean);
    if (parts.length >= 4) {
      return [`${parts[0]}，${parts[1]}`, `${parts[2]}，${parts[3]}`];
    }
    if (parts.length === 3) {
      return [parts[0], `${parts[1]}，${parts[2]}`];
    }
    if (parts.length === 2) {
      return [parts[0], parts[1]];
    }

    const mid = Math.ceil(cleaned.length / 2);
    return [cleaned.slice(0, mid), cleaned.slice(mid)];
  }

  function renderPoem(el, message) {
    if (!el) return;
    const [line1, line2] = formatPoemLines(message);
    el.innerHTML = `
      <p class="fortune-stick-line">${line1}</p>
      <p class="fortune-stick-line">${line2}</p>`;
  }

  function normalizeStickResult(raw, payload) {
    const msg = typeof raw?.message === 'string' ? raw.message.trim() : '';
    if (!msg) return localStick(payload);
    const oneLine = msg.replace(/\s+/g, '').split(/[。！？\n]/)[0];
    return {
      stickNo: pickStickLabel(),
      message: oneLine || msg,
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
      return normalizeStickResult(raw, payload);
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
      renderPoem(msgEl, result.message);
      card.classList.remove('hidden');

      busy = false;
      btn.disabled = false;
    });
  }

  window.FortuneStick = { bind, buildPayload, analyzePreference, localStick };
})();
