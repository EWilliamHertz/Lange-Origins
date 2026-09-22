// Simple Web Audio API Synthesizer for game sounds
const isBrowser = typeof window !== 'undefined';
const AudioContextClass = isBrowser ? (window.AudioContext || (window as any).webkitAudioContext) : null;
const ctx: AudioContext | null = AudioContextClass ? new AudioContextClass() : null;

// Read saved audio channel volumes
function getSavedAudioChannels() {
  if (typeof localStorage === 'undefined') return { master: 0.7, music: 0.5, sfx: 0.7, ui: 0.8 };
  try {
    const raw = localStorage.getItem('lange_audio_channels');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { master: 0.7, music: 0.5, sfx: 0.7, ui: 0.8 };
}

const savedChannels = getSavedAudioChannels();

const masterGain: GainNode | null = ctx ? ctx.createGain() : null;
const musicGain: GainNode | null = ctx ? ctx.createGain() : null;
const sfxGain: GainNode | null = ctx ? ctx.createGain() : null;
const uiGain: GainNode | null = ctx ? ctx.createGain() : null;

if (masterGain && ctx) {
  masterGain.gain.value = savedChannels.master ?? 0.7;
  masterGain.connect(ctx.destination);
}
if (musicGain && masterGain) {
  musicGain.gain.value = savedChannels.music ?? 0.5;
  musicGain.connect(masterGain);
}
if (sfxGain && masterGain) {
  sfxGain.gain.value = savedChannels.sfx ?? 0.7;
  sfxGain.connect(masterGain);
}
if (uiGain && masterGain) {
  uiGain.gain.value = savedChannels.ui ?? 0.8;
  uiGain.connect(masterGain);
}

function persistAudioChannels() {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem('lange_audio_channels', JSON.stringify({
      master: masterGain?.gain.value ?? 0.7,
      music: musicGain?.gain.value ?? 0.5,
      sfx: sfxGain?.gain.value ?? 0.7,
      ui: uiGain?.gain.value ?? 0.8,
    }));
  } catch (e) {}
}

export const AudioChannels = {
  setMasterVolume: (vol: number) => {
    if (!ctx || !masterGain) return;
    if (ctx.state === 'suspended') ctx.resume();
    const clamped = Math.max(0, Math.min(1, vol));
    masterGain.gain.linearRampToValueAtTime(clamped, ctx.currentTime + 0.05);
    persistAudioChannels();
  },
  setMusicVolume: (vol: number) => {
    if (!ctx || !musicGain) return;
    if (ctx.state === 'suspended') ctx.resume();
    const clamped = Math.max(0, Math.min(1, vol));
    musicGain.gain.linearRampToValueAtTime(clamped, ctx.currentTime + 0.05);
    persistAudioChannels();
  },
  setSfxVolume: (vol: number) => {
    if (!ctx || !sfxGain) return;
    if (ctx.state === 'suspended') ctx.resume();
    const clamped = Math.max(0, Math.min(1, vol));
    sfxGain.gain.linearRampToValueAtTime(clamped, ctx.currentTime + 0.05);
    persistAudioChannels();
  },
  setUiVolume: (vol: number) => {
    if (!ctx || !uiGain) return;
    if (ctx.state === 'suspended') ctx.resume();
    const clamped = Math.max(0, Math.min(1, vol));
    uiGain.gain.linearRampToValueAtTime(clamped, ctx.currentTime + 0.05);
    persistAudioChannels();
  },
  getVolumes: () => ({
    master: masterGain?.gain.value ?? 0.7,
    music: musicGain?.gain.value ?? 0.5,
    sfx: sfxGain?.gain.value ?? 0.7,
    ui: uiGain?.gain.value ?? 0.8,
  })
};

export const AudioController = {
  setVolume: AudioChannels.setMasterVolume,
  getVolume: () => masterGain?.gain.value ?? 0.7
};

function playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1, channel: 'sfx' | 'ui' | 'music' = 'sfx') {
  if (!ctx || !masterGain) return;
  if (ctx.state === 'suspended') ctx.resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  
  osc.connect(gain);
  const targetGain = channel === 'ui' ? uiGain : (channel === 'music' ? musicGain : sfxGain);
  gain.connect(targetGain || masterGain);
  
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

// Noise buffer for breaking blocks
let noiseBuffer: AudioBuffer | null = null;
function getNoiseBuffer() {
  if (!ctx) return null;
  if (noiseBuffer) return noiseBuffer;
  const bufferSize = ctx.sampleRate * 0.5;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBuffer = buffer;
  return noiseBuffer;
}

let windGain: GainNode | null = null;
let battleMusicOsc: OscillatorNode | null = null;
let battleMusicGain: GainNode | null = null;
let battleMusicInterval: any = null;

let lofiInterval: any = null;
let lofiChordNodes: OscillatorNode[] = [];
let lofiGain: GainNode | null = null;

export const Sounds = {
  setVolume: AudioController.setVolume,
  
  startLofiMusic: () => {
    if (!ctx) return;
    try {
      if (lofiInterval) return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      
      lofiGain = ctx.createGain();
      lofiGain.gain.value = 0.2; // Background volume
      const targetGain = musicGain || masterGain;
      if (targetGain) {
        lofiGain.connect(targetGain);
      } else {
        lofiGain.connect(ctx.destination);
      }
      
      // Chill Lofi Hiphop procedural generator
      const tempo = 80; // BPM
      const beatTime = 60 / tempo; 
      let step = 0;
      
      // Chords (Cmaj7, Amin7, Fmaj7, G7) in Hz
      const progression = [
         [130.81, 164.81, 196.00, 246.94], // Cmaj7
         [110.00, 130.81, 164.81, 196.00], // Amin7
         [87.31,  110.00, 130.81, 164.81], // Fmaj7
         [98.00,  123.47, 146.83, 174.61], // G7
      ];
      
      // Tape noise / vinyl crackle overlay
      const nBuf = getNoiseBuffer();
      if (nBuf) {
        try {
          const vinylSource = ctx.createBufferSource();
          vinylSource.buffer = nBuf;
          vinylSource.loop = true;
          const vinylFilter = ctx.createBiquadFilter();
          vinylFilter.type = 'lowpass';
          vinylFilter.frequency.value = 400;
          const vinylVol = ctx.createGain();
          vinylVol.gain.value = 0.02;
          vinylSource.connect(vinylFilter);
          vinylFilter.connect(vinylVol);
          if (lofiGain) vinylVol.connect(lofiGain);
          vinylSource.start();
          lofiChordNodes.push(vinylSource as any);
        } catch (e) {}
      }

      function playKick() {
         if (!ctx || !lofiGain) return;
         try {
           const osc = ctx.createOscillator();
           const gain = ctx.createGain();
           osc.frequency.setValueAtTime(150, ctx.currentTime);
           osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
           gain.gain.setValueAtTime(0.8, ctx.currentTime);
           gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
           osc.connect(gain);
           gain.connect(lofiGain);
           osc.start(ctx.currentTime);
           osc.stop(ctx.currentTime + 0.5);
         } catch (e) {}
      }
      
      function playSnare() {
         if (!ctx || !lofiGain) return;
         const noiseBuffer = getNoiseBuffer();
         if (!noiseBuffer) return;
         try {
           const noise = ctx.createBufferSource();
           noise.buffer = noiseBuffer;
           const filter = ctx.createBiquadFilter();
           filter.type = 'highpass';
           filter.frequency.value = 1000;
           const gain = ctx.createGain();
           gain.gain.setValueAtTime(0.3, ctx.currentTime);
           gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
           noise.connect(filter);
           filter.connect(gain);
           gain.connect(lofiGain);
           noise.start(ctx.currentTime);
           noise.stop(ctx.currentTime + 0.2);
         } catch (e) {}
      }
      
      function playHihat() {
         if (!ctx || !lofiGain) return;
         const noiseBuffer = getNoiseBuffer();
         if (!noiseBuffer) return;
         try {
           const noise = ctx.createBufferSource();
           noise.buffer = noiseBuffer;
           const filter = ctx.createBiquadFilter();
           filter.type = 'highpass';
           filter.frequency.value = 5000;
           const gain = ctx.createGain();
           gain.gain.setValueAtTime(0.1, ctx.currentTime);
           gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
           noise.connect(filter);
           filter.connect(gain);
           gain.connect(lofiGain);
           noise.start(ctx.currentTime);
           noise.stop(ctx.currentTime + 0.05);
         } catch (e) {}
      }
      
      function playChord(chord: number[]) {
          if (!ctx || !lofiGain) return;
          lofiChordNodes.forEach(n => { try { n.stop?.(); n.disconnect?.(); } catch(e){} });
          lofiChordNodes = [];
          
          chord.forEach(freq => {
              if (!ctx || !lofiGain) return;
              try {
                const osc = ctx.createOscillator();
                osc.type = 'sine'; // very chill, smooth
                const gain = ctx.createGain();
                
                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                // Slight detune for that lofi wow/flutter
                const detuneLFO = ctx.createOscillator();
                detuneLFO.frequency.value = 0.5;
                const detuneGain = ctx.createGain();
                detuneGain.gain.value = 10;
                detuneLFO.connect(detuneGain);
                detuneGain.connect(osc.detune);
                detuneLFO.start();
                
                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.5); // slow attack
                gain.gain.setTargetAtTime(0, ctx.currentTime + beatTime * 3, 0.5); // slow release
                
                const filter = ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = 800; // dull sound
                
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(lofiGain);
                
                osc.start();
                lofiChordNodes.push(osc);
                lofiChordNodes.push(detuneLFO);
              } catch (e) {}
          });
      }

      lofiInterval = setInterval(() => {
          try {
            // 16 step sequencer
            const s = step % 16;
            
            // Drums
            if (s === 0 || s === 10) playKick();
            if (s === 4 || s === 12) playSnare();
            if (s % 2 === 0) playHihat(); // 8th note hihats
            
            // Chords (change every 2 bars / 32 steps)
            if (s === 0) {
                const chordIdx = Math.floor((step / 16) % 4);
                playChord(progression[chordIdx]);
            }
            
            step++;
          } catch (e) {}
      }, (beatTime * 1000) / 4); // 16th notes
    } catch (err) {
      console.warn('Lofi music playback failed to initialize:', err);
    }
  },
  
  stopLofiMusic: () => {
      try {
        if (lofiInterval) {
            clearInterval(lofiInterval);
            lofiInterval = null;
        }
        lofiChordNodes.forEach(n => { try { n.stop?.(); n.disconnect?.(); } catch(e){} });
        lofiChordNodes = [];
      } catch (e) {}

      if (lofiGain) {
          lofiGain.disconnect();
          lofiGain = null;
      }
  },

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
    gain.connect(masterGain);
    
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
    gain.connect(sfxGain || masterGain);
    
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
    windGain.connect(musicGain || masterGain);
    
    source.start();
    
    // Modulate wind
    setInterval(() => {
       if (windGain) {
          const targetVol = 0.01 + Math.random() * 0.03;
          windGain.gain.linearRampToValueAtTime(targetVol, ctx.currentTime + 2);
       }
    }, 2000);
  },
  
  stopWind: () => {
    if (windGain) {
       windGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
       setTimeout(() => {
          if (windGain) {
             windGain.disconnect();
             windGain = null;
          }
       }, 1000);
    }
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
    battleMusicGain.connect(musicGain || masterGain);
    
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
    playTone(523.25, 'triangle', 0.15, 0.18); // C5
    setTimeout(() => playTone(659.25, 'triangle', 0.15, 0.18), 90); // E5
    setTimeout(() => playTone(783.99, 'triangle', 0.18, 0.2), 180); // G5
    setTimeout(() => {
      playTone(1046.50, 'sine', 0.45, 0.25); // C6 bell
      playTone(523.25, 'triangle', 0.45, 0.15); // C5 bass
    }, 280);
  },
  equipGear: () => {
    playTone(700, 'sine', 0.08, 0.15, 'ui');
    setTimeout(() => playTone(1050, 'triangle', 0.12, 0.2, 'ui'), 40);
  },
  dropItem: () => {
    playTone(280, 'sine', 0.08, 0.12, 'ui');
    setTimeout(() => playTone(180, 'sine', 0.12, 0.15, 'ui'), 35);
  },
  craftSuccess: () => {
    playTone(440, 'triangle', 0.1, 0.18, 'ui'); // A4
    setTimeout(() => playTone(554.37, 'triangle', 0.12, 0.2, 'ui'), 75); // C#5
    setTimeout(() => playTone(659.25, 'sine', 0.25, 0.22, 'ui'), 150); // E5
  },
  slotClick: () => {
    playTone(850, 'sine', 0.03, 0.08, 'ui');
  },
  slotHover: (() => {
    let lastHover = 0;
    return () => {
      const now = performance.now();
      if (now - lastHover > 60) {
        lastHover = now;
        playTone(1200, 'sine', 0.02, 0.03, 'ui');
      }
    };
  })(),
  hurt: () => {
    playTone(150, 'sawtooth', 0.2, 0.3);
    setTimeout(() => playTone(120, 'square', 0.2, 0.3), 50);
  },
  openChest: () => {
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
  },
  anvilHit: () => {
    playTone(180, 'triangle', 0.15, 0.25);
    setTimeout(() => playTone(880, 'sine', 0.2, 0.3), 30);
    setTimeout(() => playTone(1760, 'sine', 0.1, 0.15), 50);
  },
  craft: () => {
    playTone(440, 'triangle', 0.1, 0.18);
    setTimeout(() => playTone(554.37, 'triangle', 0.12, 0.2), 75);
    setTimeout(() => playTone(659.25, 'sine', 0.25, 0.22), 150);
  },
  shield: () => {
    playTone(320, 'triangle', 0.15, 0.2);
    setTimeout(() => playTone(640, 'sine', 0.2, 0.15), 40);
  },
  eat: () => {
    playTone(320, 'sine', 0.08, 0.2, 'sfx');
    setTimeout(() => playTone(480, 'triangle', 0.07, 0.25, 'sfx'), 70);
    setTimeout(() => playTone(260, 'sine', 0.12, 0.18, 'sfx'), 140);
  },
  sizzle: () => {
    if (ctx && ctx.state === 'suspended') ctx.resume();
    if (ctx && masterGain) {
      const buffer = getNoiseBuffer();
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2400;
      filter.Q.value = 1.2;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.2, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      src.connect(filter);
      filter.connect(g);
      g.connect(masterGain);
      src.start();
      src.stop(ctx.currentTime + 0.6);
    }
  },
  wolfHowl: () => {
    playTone(220, 'sine', 0.3, 0.2, 'sfx');
    setTimeout(() => playTone(330, 'sine', 0.4, 0.25, 'sfx'), 150);
    setTimeout(() => playTone(440, 'sine', 0.5, 0.28, 'sfx'), 350);
    setTimeout(() => playTone(392, 'sine', 0.4, 0.18, 'sfx'), 650);
  },
  railClick: () => {
    playTone(720, 'triangle', 0.03, 0.12, 'sfx');
    setTimeout(() => playTone(840, 'triangle', 0.03, 0.15, 'sfx'), 45);
  },
  death: () => {
    playTone(220, 'sawtooth', 0.3, 0.3, 'sfx');
    setTimeout(() => playTone(165, 'sawtooth', 0.4, 0.25, 'sfx'), 150);
    setTimeout(() => playTone(110, 'sawtooth', 0.6, 0.2, 'sfx'), 350);
  },
  hit: () => {
    playTone(180, 'triangle', 0.08, 0.3, 'sfx');
    setTimeout(() => playTone(120, 'square', 0.06, 0.25, 'sfx'), 40);
  },
  waterSplashed: () => {
    playTone(340, 'sine', 0.12, 0.22, 'sfx');
    setTimeout(() => playTone(280, 'sine', 0.15, 0.2, 'sfx'), 60);
    setTimeout(() => playTone(440, 'triangle', 0.1, 0.15, 'sfx'), 120);
  },
  spellCast: () => {
    playTone(520, 'sine', 0.15, 0.25, 'sfx');
    setTimeout(() => playTone(780, 'sine', 0.2, 0.22, 'sfx'), 80);
    setTimeout(() => playTone(1040, 'sine', 0.25, 0.2, 'sfx'), 160);
  },
};
