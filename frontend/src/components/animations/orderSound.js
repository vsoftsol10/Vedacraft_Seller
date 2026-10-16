// Sounds for the new-order animation (synthesised, no mp3 needed).
//  - playTruckSound: truck air horn honks while the truck is driving (no engine sound)
//  - playBurstSound: pop + confetti-shower blast when the leaves burst

let ctx;
const BLOCKED_MSG =
  '[order sound] The browser is blocking audio. Click anywhere on the page once, then try again.';

function createContext() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  const c = new AC();
  c.onstatechange = () => console.info('[order sound] audio state:', c.state);
  return c;
}

// resume() can hang forever (no error) when the browser refuses; never wait longer than this.
const tryResume = (c) =>
  Promise.race([
    c.resume().catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, 400)),
  ]);

// Returns an audio context that is really running, or null. If the shared one has gone to
// sleep and will not wake up, it is thrown away and replaced with a fresh one.
async function acquireContext() {
  if (!ctx || ctx.state === 'closed') ctx = createContext();
  if (!ctx) return null;
  if (ctx.state !== 'running') await tryResume(ctx);
  if (ctx.state !== 'running') {
    try { await ctx.close(); } catch { /* ignore */ }
    ctx = createContext();
    if (!ctx) return null;
    await tryResume(ctx);
  }
  return ctx.state === 'running' ? ctx : null;
}

function withRunningContext(fn) {
  acquireContext().then((ac) => {
    if (!ac) {
      console.warn(BLOCKED_MSG);
      return;
    }
    try {
      fn(ac);
    } catch (err) {
      console.error('[order sound] failed:', err);
    }
  });
}

// Browsers keep audio silent until the user clicks/taps/presses a key on the page.
// Call once on app load; the first interaction "unlocks" sound for later.
// It also wakes the audio up again whenever the seller comes back to the tab.
export function unlockAudioOnFirstTouch() {
  const events = ['pointerdown', 'click', 'touchstart', 'keydown'];
  const unlock = async () => {
    const ac = await acquireContext();
    if (!ac) return;
    const src = ac.createBufferSource(); // one silent sample (needed by iOS Safari)
    src.buffer = ac.createBuffer(1, 1, 22050);
    src.connect(ac.destination);
    src.start(0);
  };
  const wake = () => {
    if (document.visibilityState === 'visible' && ctx && ctx.state !== 'running') tryResume(ctx);
  };
  events.forEach((e) => window.addEventListener(e, unlock));
  document.addEventListener('visibilitychange', wake);
  return () => {
    events.forEach((e) => window.removeEventListener(e, unlock));
    document.removeEventListener('visibilitychange', wake);
  };
}

function noiseBuffer(ac, seconds) {
  const length = Math.ceil(ac.sampleRate * seconds);
  const buffer = ac.createBuffer(1, length, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  return buffer;
}

// One two-tone air-horn honk starting at `start` seconds, lasting `length` seconds.
function honk(ac, out, nodes, start, length) {
  [311, 392].forEach((freq) => {
    [0, 4].forEach((detuneCents) => {
      const o = ac.createOscillator();
      const lp = ac.createBiquadFilter();
      const g = ac.createGain();
      o.type = 'sawtooth';
      o.frequency.value = freq;
      o.detune.value = detuneCents;
      lp.type = 'lowpass';
      lp.frequency.value = 2200;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(0.16, start + 0.02);
      g.gain.setValueAtTime(0.16, start + length - 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, start + length);
      o.connect(lp);
      lp.connect(g);
      g.connect(out);
      o.start(start);
      o.stop(start + length + 0.02);
      nodes.push(o);
    });
  });
  // Short rush of air at the start of each honk
  const air = ac.createBufferSource();
  air.buffer = noiseBuffer(ac, 0.12);
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 1500;
  const ag = ac.createGain();
  ag.gain.setValueAtTime(0.12, start);
  ag.gain.exponentialRampToValueAtTime(0.0001, start + 0.1);
  air.connect(hp);
  hp.connect(ag);
  ag.connect(out);
  air.start(start);
  nodes.push(air);
}

// Truck horn honks while the truck drives: "pap-paaap" at the start, then a honk every ~2.2 s.
// Returns stop().
export function playTruckSound(seconds = 3) {
  const nodes = [];
  let cancelled = false;
  withRunningContext((ac) => {
    if (cancelled) return;
    const t = ac.currentTime;
    const master = ac.createGain();
    master.gain.value = 1;
    const comp = ac.createDynamicsCompressor();
    master.connect(comp);
    comp.connect(ac.destination);

    honk(ac, master, nodes, t, 0.3);
    honk(ac, master, nodes, t + 0.5, 0.75);
    for (let at = 2.6; at < seconds - 1.2; at += 2.2) {
      honk(ac, master, nodes, t + at, 0.5);
    }
  });
  return () => {
    cancelled = true;
    nodes.forEach((n) => { try { n.stop(); } catch { /* already stopped */ } });
  };
}

// Blast when the leaves burst: low thump + sharp pop + a confetti/leaf shower that fades out.
export function playBurstSound() {
  withRunningContext((ac) => {
    const t = ac.currentTime;
    const out = ac.createGain();
    out.gain.value = 1;
    const comp = ac.createDynamicsCompressor();
    out.connect(comp);
    comp.connect(ac.destination);

    // 1. Low thump (the "boom")
    const thump = ac.createOscillator();
    const thumpGain = ac.createGain();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(180, t);
    thump.frequency.exponentialRampToValueAtTime(45, t + 0.25);
    thumpGain.gain.setValueAtTime(0.9, t);
    thumpGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    thump.connect(thumpGain);
    thumpGain.connect(out);
    thump.start(t);
    thump.stop(t + 0.32);

    // 2. Sharp pop (the "crack")
    const crack = ac.createBufferSource();
    crack.buffer = noiseBuffer(ac, 0.2);
    const crackFilter = ac.createBiquadFilter();
    crackFilter.type = 'highpass';
    crackFilter.frequency.value = 1200;
    const crackGain = ac.createGain();
    crackGain.gain.setValueAtTime(0.9, t);
    crackGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    crack.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(out);
    crack.start(t);

    // 3. Leaves and confetti flying and falling (a swishing shower)
    const shower = ac.createBufferSource();
    shower.buffer = noiseBuffer(ac, 1.4);
    const sweep = ac.createBiquadFilter();
    sweep.type = 'bandpass';
    sweep.Q.value = 0.8;
    sweep.frequency.setValueAtTime(3500, t + 0.02);
    sweep.frequency.exponentialRampToValueAtTime(900, t + 1.2);
    const showerGain = ac.createGain();
    showerGain.gain.setValueAtTime(0.0001, t);
    showerGain.gain.exponentialRampToValueAtTime(0.45, t + 0.06);
    showerGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
    shower.connect(sweep);
    sweep.connect(showerGain);
    showerGain.connect(out);
    shower.start(t + 0.02);
  });
}