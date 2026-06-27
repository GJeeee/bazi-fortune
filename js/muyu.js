(function () {
  let audioCtx = null;

  function getCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function makeNoiseBurst(ctx, duration, decay) {
    const len = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * decay));
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    return src;
  }

  function playMuyuSound() {
    try {
      const ctx = getCtx();
      const t = ctx.currentTime;

      // 清脆敲击：短促高频点击
      const click = makeNoiseBurst(ctx, 0.018, 0.003);
      const clickFilter = ctx.createBiquadFilter();
      clickFilter.type = 'bandpass';
      clickFilter.frequency.setValueAtTime(2800, t);
      clickFilter.frequency.exponentialRampToValueAtTime(1600, t + 0.012);
      clickFilter.Q.value = 1.1;

      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(0.001, t);
      clickGain.gain.exponentialRampToValueAtTime(0.55, t + 0.001);
      clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.022);

      click.connect(clickFilter);
      clickFilter.connect(clickGain);
      clickGain.connect(ctx.destination);
      click.start(t);
      click.stop(t + 0.025);

      // 木鱼主体：中频撞击
      const knock = makeNoiseBurst(ctx, 0.03, 0.006);
      const knockFilter = ctx.createBiquadFilter();
      knockFilter.type = 'bandpass';
      knockFilter.frequency.setValueAtTime(920, t);
      knockFilter.frequency.exponentialRampToValueAtTime(520, t + 0.018);
      knockFilter.Q.value = 0.95;

      const knockGain = ctx.createGain();
      knockGain.gain.setValueAtTime(0.001, t);
      knockGain.gain.exponentialRampToValueAtTime(0.48, t + 0.0012);
      knockGain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

      knock.connect(knockFilter);
      knockFilter.connect(knockGain);
      knockGain.connect(ctx.destination);
      knock.start(t);
      knock.stop(t + 0.04);

      // 木腔余韵
      const body = makeNoiseBurst(ctx, 0.1, 0.022);
      const bodyFilter = ctx.createBiquadFilter();
      bodyFilter.type = 'lowpass';
      bodyFilter.frequency.setValueAtTime(480, t);
      bodyFilter.frequency.exponentialRampToValueAtTime(220, t + 0.08);

      const bodyGain = ctx.createGain();
      bodyGain.gain.setValueAtTime(0.001, t);
      bodyGain.gain.exponentialRampToValueAtTime(0.22, t + 0.002);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      body.connect(bodyFilter);
      bodyFilter.connect(bodyGain);
      bodyGain.connect(ctx.destination);
      body.start(t);
      body.stop(t + 0.13);

      // 清脆泛音
      const ping = ctx.createOscillator();
      ping.type = 'sine';
      ping.frequency.setValueAtTime(1560, t);
      ping.frequency.exponentialRampToValueAtTime(1180, t + 0.03);
      const pingGain = ctx.createGain();
      pingGain.gain.setValueAtTime(0.001, t);
      pingGain.gain.exponentialRampToValueAtTime(0.12, t + 0.001);
      pingGain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
      ping.connect(pingGain);
      pingGain.connect(ctx.destination);
      ping.start(t);
      ping.stop(t + 0.05);
    } catch {
      // 静音或不支持 Web Audio 时忽略
    }
  }

  function spawnMeritFloat(btn) {
    const wrap = btn.querySelector('.muyu-wrap');
    if (!wrap) return;

    const el = document.createElement('span');
    el.className = 'muyu-merit-float';
    el.textContent = '功德 +1';
    el.setAttribute('aria-hidden', 'true');
    wrap.appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }

  function tapMuyu(btn) {
    if (!btn) return;
    playMuyuSound();
    spawnMeritFloat(btn);
    btn.classList.remove('is-tapping');
    void btn.offsetWidth;
    btn.classList.add('is-tapping');
  }

  window.Muyu = { playMuyuSound, tapMuyu, spawnMeritFloat };
})();
