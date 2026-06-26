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

      // 杆击木：短促撞击（偏中低频，少金属感）
      const knock = makeNoiseBurst(ctx, 0.035, 0.005);
      const knockFilter = ctx.createBiquadFilter();
      knockFilter.type = 'bandpass';
      knockFilter.frequency.setValueAtTime(680, t);
      knockFilter.frequency.exponentialRampToValueAtTime(320, t + 0.02);
      knockFilter.Q.value = 0.9;

      const knockGain = ctx.createGain();
      knockGain.gain.setValueAtTime(0.001, t);
      knockGain.gain.exponentialRampToValueAtTime(0.62, t + 0.0015);
      knockGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      knock.connect(knockFilter);
      knockFilter.connect(knockGain);
      knockGain.connect(ctx.destination);
      knock.start(t);
      knock.stop(t + 0.045);

      // 木腔闷响：滤波噪声（非谐波，更像实心木）
      const body = makeNoiseBurst(ctx, 0.14, 0.028);
      const bodyFilter = ctx.createBiquadFilter();
      bodyFilter.type = 'lowpass';
      bodyFilter.frequency.setValueAtTime(420, t);
      bodyFilter.frequency.exponentialRampToValueAtTime(160, t + 0.1);

      const bodyGain = ctx.createGain();
      bodyGain.gain.setValueAtTime(0.001, t);
      bodyGain.gain.exponentialRampToValueAtTime(0.42, t + 0.003);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      body.connect(bodyFilter);
      bodyFilter.connect(bodyGain);
      bodyGain.connect(ctx.destination);
      body.start(t);
      body.stop(t + 0.17);

      // 轻回弹：第二下更弱、更闷
      const t2 = t + 0.048;
      const knock2 = makeNoiseBurst(ctx, 0.022, 0.004);
      const kf2 = ctx.createBiquadFilter();
      kf2.type = 'bandpass';
      kf2.frequency.value = 480;
      kf2.Q.value = 0.85;
      const kg2 = ctx.createGain();
      kg2.gain.setValueAtTime(0.001, t2);
      kg2.gain.exponentialRampToValueAtTime(0.18, t2 + 0.0015);
      kg2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.028);
      knock2.connect(kf2);
      kf2.connect(kg2);
      kg2.connect(ctx.destination);
      knock2.start(t2);
      knock2.stop(t2 + 0.032);
    } catch {
      // 静音或不支持 Web Audio 时忽略
    }
  }

  function tapMuyu(btn) {
    if (!btn) return;
    playMuyuSound();
    btn.classList.remove('is-tapping');
    void btn.offsetWidth;
    btn.classList.add('is-tapping');
  }

  window.Muyu = { playMuyuSound, tapMuyu };
})();
