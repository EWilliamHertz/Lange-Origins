import fs from 'fs';
let code = fs.readFileSync('src/lib/audio.ts', 'utf8');

const additionalAudio = `
let windGain: GainNode | null = null;
let battleMusicOsc: OscillatorNode | null = null;
let battleMusicGain: GainNode | null = null;
let battleMusicInterval: any = null;

export const Sounds = {
  click: () => {
    playTone(600, 'sine', 0.05, 0.1);
  },
  placeBlock: () => {
    playTone(150, 'triangle', 0.1, 0.2);
  },
  mineBlock: () => {
    if (ctx.state === 'suspended') ctx.resume();
    const source = ctx.createBufferSource();
    source.buffer = getNoiseBuffer();
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    source.start();
    source.stop(ctx.currentTime + 0.15);
  },
  footstep: (blockType: number) => {
    if (ctx.state === 'suspended') ctx.resume();
    const source = ctx.createBufferSource();
    source.buffer = getNoiseBuffer();
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    
    // Pitch shift based on block type
    if (blockType === 2) { // Grass
       filter.frequency.value = 400;
    } else if (blockType === 3) { // Stone
       filter.frequency.value = 800;
    } else if (blockType === 4 || blockType === 6) { // Wood
       filter.frequency.value = 300;
    } else if (blockType === 203) { // Snow
       filter.frequency.value = 1000;
    } else {
       filter.frequency.value = 600;
    }
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    source.start();
    source.stop(ctx.currentTime + 0.1);
  },
  startWind: () => {
    if (windGain) return;
    if (ctx.state === 'suspended') ctx.resume();
    const source = ctx.createBufferSource();
    source.buffer = getNoiseBuffer();
    source.loop = true;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    
    windGain = ctx.createGain();
    windGain.gain.setValueAtTime(0.02, ctx.currentTime);
    
    source.connect(filter);
    filter.connect(windGain);
    windGain.connect(ctx.destination);
    
    source.start();
    
    // Modulate wind
    setInterval(() => {
       if (windGain) {
          const targetVol = 0.01 + Math.random() * 0.03;
          windGain.gain.linearRampToValueAtTime(targetVol, ctx.currentTime + 2);
       }
    }, 2000);
  },
  startBattleMusic: () => {
    if (battleMusicOsc) return;
    if (ctx.state === 'suspended') ctx.resume();
    
    battleMusicOsc = ctx.createOscillator();
    battleMusicOsc.type = 'sawtooth';
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    
    battleMusicGain = ctx.createGain();
    battleMusicGain.gain.setValueAtTime(0, ctx.currentTime);
    battleMusicGain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 1); // fade in
    
    battleMusicOsc.connect(filter);
    filter.connect(battleMusicGain);
    battleMusicGain.connect(ctx.destination);
    
    battleMusicOsc.start();
    
    const notes = [150, 150, 180, 140, 150, 200];
    let noteIdx = 0;
    battleMusicInterval = setInterval(() => {
        if (battleMusicOsc) {
           battleMusicOsc.frequency.setValueAtTime(notes[noteIdx], ctx.currentTime);
           noteIdx = (noteIdx + 1) % notes.length;
        }
    }, 250);
  },
  stopBattleMusic: () => {
    if (battleMusicGain && battleMusicOsc) {
       battleMusicGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1); // fade out
       setTimeout(() => {
           if (battleMusicOsc) {
             battleMusicOsc.stop();
             battleMusicOsc.disconnect();
             battleMusicOsc = null;
           }
           if (battleMusicGain) {
             battleMusicGain.disconnect();
             battleMusicGain = null;
           }
           if (battleMusicInterval) clearInterval(battleMusicInterval);
       }, 1000);
    }
  },
  levelUp: () => {
`;
code = code.replace(/export const Sounds = \{\n\s*click: \(\) => \{[\s\S]*?levelUp: \(\) => \{/, additionalAudio);

fs.writeFileSync('src/lib/audio.ts', code);
