(function () {
  const WUXING = ['木', '火', '土', '金', '水'];
  const SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  const SHENG_BY = { 火: '木', 土: '火', 金: '土', 水: '金', 木: '水' };

  const SHAKE_DURATION_MS = 720;
  const POP_DURATION_MS = 580;
  const COOLDOWN_MS = 3200;
  const LONG_PRESS_MS = 3200;
  const MOTION_THRESHOLD = 14;
  const MOTION_HIT_COUNT = 4;
  const SHAKE_SOUND_SRC = 'audio/shake_sound.mp3';
  const DROP_SOUND_SRC = 'audio/drop_click.mp3';

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

  function playDropClick() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const t = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(920, t);
      osc.frequency.exponentialRampToValueAtTime(380, t + 0.045);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.exponentialRampToValueAtTime(0.22, t + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.12);

      const click = ctx.createOscillator();
      const clickGain = ctx.createGain();
      click.type = 'triangle';
      click.frequency.setValueAtTime(1800, t + 0.01);
      clickGain.gain.setValueAtTime(0.001, t + 0.01);
      clickGain.gain.exponentialRampToValueAtTime(0.08, t + 0.014);
      clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      click.connect(clickGain);
      clickGain.connect(ctx.destination);
      click.start(t + 0.01);
      click.stop(t + 0.07);
    } catch {
      // ignore
    }
  }

  function createDropSound() {
    let audio = null;
    let useFallback = true;

    try {
      audio = new Audio(DROP_SOUND_SRC);
      audio.preload = 'auto';
      audio.addEventListener('canplaythrough', () => {
        useFallback = false;
      }, { once: true });
      audio.addEventListener('error', () => {
        useFallback = true;
      });
    } catch {
      useFallback = true;
    }

    return {
      play() {
        if (useFallback || !audio) {
          playDropClick();
          return;
        }
        audio.currentTime = 0;
        audio.play().catch(() => playDropClick());
      },
    };
  }

  function playFallbackShakeSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const t = ctx.currentTime;
      for (let i = 0; i < 8; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = 160 + Math.random() * 140;
        const start = t + i * 0.06;
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(0.07, start + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.055);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.06);
      }
    } catch {
      // ignore
    }
  }

  function createShakeSound() {
    let audio = null;
    let useFallback = false;
    let fallbackTimer = null;

    try {
      audio = new Audio(SHAKE_SOUND_SRC);
      audio.loop = true;
      audio.preload = 'auto';
      audio.addEventListener('error', () => {
        useFallback = true;
      });
    } catch {
      useFallback = true;
    }

    return {
      async start() {
        if (useFallback || !audio) {
          playFallbackShakeSound();
          fallbackTimer = window.setInterval(playFallbackShakeSound, 280);
          return;
        }
        try {
          audio.currentTime = 0;
          await audio.play();
        } catch {
          useFallback = true;
          playFallbackShakeSound();
          fallbackTimer = window.setInterval(playFallbackShakeSound, 280);
        }
      },
      stop() {
        if (fallbackTimer) {
          clearInterval(fallbackTimer);
          fallbackTimer = null;
        }
        if (audio && !useFallback) {
          audio.pause();
          audio.currentTime = 0;
        }
      },
    };
  }

  function needsMotionPermission() {
    return (
      typeof DeviceMotionEvent !== 'undefined' &&
      typeof DeviceMotionEvent.requestPermission === 'function'
    );
  }

  function bind(options) {
    const btn = options.btn;
    const card = options.card;
    const noEl = options.noEl;
    const msgEl = options.msgEl;
    const hintEl = options.hintEl;
    const getCtx = options.getCtx;
    const isActive = options.isActive || (() => true);
    if (!btn || !card || !getCtx) return null;

    const shakeSound = createShakeSound();
    const dropSound = createDropSound();
    let busy = false;
    let cooldownUntil = 0;
    let motionEnabled = false;
    let lastAcc = { x: 0, y: 0, z: 0 };
    let motionHits = 0;
    let lastMotionAt = 0;
    let holdTimer = null;
    let holdStartedAt = 0;
    let holding = false;
    let holdVibrateTimer = null;

    function setHint(text, visible) {
      if (!hintEl) return;
      hintEl.textContent = text || '';
      hintEl.classList.toggle('hidden', !visible || !text);
    }

    function clearHoldState() {
      holding = false;
      holdStartedAt = 0;
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
      if (holdVibrateTimer) {
        clearInterval(holdVibrateTimer);
        holdVibrateTimer = null;
      }
      btn.classList.remove('is-holding');
    }

    function startHold() {
      if (busy || Date.now() < cooldownUntil || holding) return;
      holding = true;
      holdStartedAt = Date.now();
      btn.classList.add('is-holding');
      setHint('继续按住，签文马上出来…', true);

      if (navigator.vibrate) navigator.vibrate(8);
      holdVibrateTimer = window.setInterval(() => {
        if (navigator.vibrate) navigator.vibrate(6);
      }, 420);

      holdTimer = window.setTimeout(() => {
        clearHoldState();
        runShake('longpress');
      }, LONG_PRESS_MS);
    }

    function cancelHold() {
      if (!holding || busy) return;
      const elapsed = Date.now() - holdStartedAt;
      clearHoldState();
      if (elapsed < LONG_PRESS_MS - 80) {
        updateMotionHint();
      }
    }

    function updateMotionHint() {
      if (!window.DeviceMotionEvent) {
        setHint('长按签筒 3 秒 · 解压求签', true);
        return;
      }
      if (needsMotionPermission() && !motionEnabled) {
        setHint('长按签筒 · 或点击开启摇一摇', true);
        return;
      }
      if (motionEnabled) {
        setHint('长按签筒 · 或轻摇手机', true);
        return;
      }
      setHint('长按签筒 3 秒 · 或轻摇手机', true);
    }

    async function enableMotion() {
      if (motionEnabled || !window.DeviceMotionEvent) return motionEnabled;

      if (needsMotionPermission()) {
        try {
          const state = await DeviceMotionEvent.requestPermission();
          if (state !== 'granted') {
            setHint('未授权运动传感器，可点击求签', true);
            return false;
          }
        } catch {
          setHint('无法启用摇一摇，可点击求签', true);
          return false;
        }
      }

      window.addEventListener('devicemotion', onDeviceMotion, { passive: true });
      motionEnabled = true;
      updateMotionHint();
      return true;
    }

    function onDeviceMotion(e) {
      if (!isActive() || busy || Date.now() < cooldownUntil) return;

      const acc = e.accelerationIncludingGravity;
      if (!acc || acc.x == null) return;

      const now = Date.now();
      if (now - lastMotionAt < 80) return;
      lastMotionAt = now;

      const delta =
        Math.abs(acc.x - lastAcc.x) + Math.abs(acc.y - lastAcc.y) + Math.abs(acc.z - lastAcc.z);
      lastAcc = { x: acc.x, y: acc.y, z: acc.z };

      if (delta > MOTION_THRESHOLD) {
        motionHits += 1;
        if (motionHits >= MOTION_HIT_COUNT) {
          motionHits = 0;
          runShake('motion');
        }
      }
    }

    function resetVisual() {
      btn.classList.remove('is-shaking', 'stick-revealed');
      card.classList.add('hidden');
      card.classList.remove('is-revealed');
    }

    async function runShake(source) {
      if (busy || Date.now() < cooldownUntil) return;
      const ctx = getCtx();
      if (!ctx || !isActive()) return;

      clearHoldState();
      busy = true;
      motionHits = 0;
      btn.disabled = true;
      resetVisual();
      btn.classList.add('is-shaking');
      setHint('', false);

      if (navigator.vibrate) navigator.vibrate([12, 40, 12, 40, 18]);
      shakeSound.start();

      const payload = buildPayload(ctx);
      const fetchPromise = fetchStick(payload);

      await new Promise((r) => setTimeout(r, SHAKE_DURATION_MS));

      shakeSound.stop();
      btn.classList.remove('is-shaking');
      btn.classList.add('stick-revealed');
      dropSound.play();
      if (navigator.vibrate) navigator.vibrate(28);

      const result = await fetchPromise;

      await new Promise((r) => setTimeout(r, POP_DURATION_MS));

      if (noEl) noEl.textContent = result.stickNo;
      renderPoem(msgEl, result.message);
      card.classList.remove('hidden');
      requestAnimationFrame(() => card.classList.add('is-revealed'));

      cooldownUntil = Date.now() + COOLDOWN_MS;
      busy = false;
      btn.disabled = false;
      updateMotionHint();
    }

    async function onPointerDown(e) {
      if (e.button !== undefined && e.button !== 0) return;
      if (needsMotionPermission() && !motionEnabled) {
        await enableMotion();
      } else if (!motionEnabled && window.DeviceMotionEvent) {
        await enableMotion();
      }
      startHold();
    }

    function onPointerUp() {
      cancelHold();
    }

    async function onTap(e) {
      if (holding || busy) {
        e.preventDefault();
        return;
      }
      if (needsMotionPermission() && !motionEnabled) {
        e.preventDefault();
        await enableMotion();
      }
    }

    btn.addEventListener('pointerdown', onPointerDown);
    btn.addEventListener('pointerup', onPointerUp);
    btn.addEventListener('pointerleave', onPointerUp);
    btn.addEventListener('pointercancel', onPointerUp);
    btn.addEventListener('click', onTap);
    updateMotionHint();

    return {
      reset() {
        busy = false;
        cooldownUntil = 0;
        motionHits = 0;
        clearHoldState();
        shakeSound.stop();
        btn.disabled = false;
        resetVisual();
        updateMotionHint();
      },
      destroy() {
        clearHoldState();
        shakeSound.stop();
        window.removeEventListener('devicemotion', onDeviceMotion);
        btn.removeEventListener('pointerdown', onPointerDown);
        btn.removeEventListener('pointerup', onPointerUp);
        btn.removeEventListener('pointerleave', onPointerUp);
        btn.removeEventListener('pointercancel', onPointerUp);
        btn.removeEventListener('click', onTap);
      },
    };
  }

  window.FortuneStick = {
    bind,
    buildPayload,
    analyzePreference,
    localStick,
    needsMotionPermission,
  };
})();
