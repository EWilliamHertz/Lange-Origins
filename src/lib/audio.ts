// Simple Web Audio API Synthesizer for game sounds
const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
const ctx = new AudioContext();

function playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1) {
  if (ctx.state === 'suspended') ctx.resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

// Noise buffer for breaking blocks
let noiseBuffer: AudioBuffer | null = null;
function getNoiseBuffer() {
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
    
    // Add a lowpass filter to make it sound like a thud
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
  levelUp: () => {
    playTone(400, 'sine', 0.1, 0.1);
    setTimeout(() => playTone(500, 'sine', 0.1, 0.1), 100);
    setTimeout(() => playTone(600, 'sine', 0.3, 0.1), 200);
  }
};
