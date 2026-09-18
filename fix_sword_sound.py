with open('src/lib/audio.ts', 'r') as f:
    content = f.read()

sword_sound = """  openChest: () => {
    playTone(300, 'triangle', 0.2, 0.1);
    setTimeout(() => playTone(400, 'sine', 0.3, 0.1), 100);
  },
  sword: () => {
    if (ctx.state === 'suspended') ctx.resume();
    const source = ctx.createBufferSource();
    source.buffer = getNoiseBuffer();
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1200;
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    
    source.start();
    source.stop(ctx.currentTime + 0.1);
  },
  fireball: () => {
    playTone(200, 'sawtooth', 0.2, 0.2);
    setTimeout(() => playTone(150, 'square', 0.2, 0.3), 100);
  },
  heal: () => {
    playTone(500, 'sine', 0.2, 0.2);
    setTimeout(() => playTone(700, 'sine', 0.3, 0.3), 100);
  },
  shoot: () => {
    playTone(400, 'square', 0.1, 0.1);
  },"""

content = content.replace("  openChest: () => {\n    playTone(300, 'triangle', 0.2, 0.1);\n    setTimeout(() => playTone(400, 'sine', 0.3, 0.1), 100);\n  }", sword_sound)

with open('src/lib/audio.ts', 'w') as f:
    f.write(content)
