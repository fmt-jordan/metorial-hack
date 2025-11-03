import { useEffect, useRef, useState } from 'react';
import { Speaker, Volume2, Mic } from 'lucide-react';

interface AudioVisualizerProps {
  type: 'microphone' | 'output';
  title: string;
  accentColor?: string;
}

export default function AudioVisualizer({ type, title, accentColor = 'cyan' }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [isActive, setIsActive] = useState(true);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const initAudio = async () => {
      try {
        if (type === 'microphone') {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioContextRef.current = new AudioContext();
          const source = audioContextRef.current.createMediaStreamSource(stream);
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 512;
          source.connect(analyserRef.current);
          dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
        } else {
          audioContextRef.current = new AudioContext();
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 512;

          const destination = audioContextRef.current.destination;
          analyserRef.current.connect(destination);

          dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
        }
      } catch (err) {
        console.log(`${type} audio capture not available, using simulation`);
      }
    };

    initAudio();

    const bars = 64;
    let phase = 0;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.fillStyle = 'rgba(2, 6, 23, 0.3)';
      ctx.fillRect(0, 0, width, height);

      let dataArray: number[];

      if (analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        dataArray = Array.from(dataArrayRef.current).slice(0, bars);
      } else {
        dataArray = Array.from({ length: bars }, (_, i) => {
          const baseFreq = Math.sin(phase + i * 0.15) * 50 + 80;
          const wave = Math.sin(phase * 2 + i * 0.3) * 30;
          const noise = Math.random() * 20;
          return baseFreq + wave + noise;
        });
      }

      const barWidth = width / bars;
      const centerY = height / 2;

      for (let i = 0; i < bars; i++) {
        const normalizedValue = dataArray[i] / 255;
        const barHeight = normalizedValue * (height * 0.4);

        const x = i * barWidth;

        const baseHue = accentColor === 'cyan' ? 180 : 150;
        const hue = (i / bars) * 60 + baseHue + phase * 10;
        const saturation = 70 + normalizedValue * 30;
        const lightness = 50 + normalizedValue * 20;

        const gradient = ctx.createLinearGradient(x, centerY - barHeight, x, centerY + barHeight);
        gradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.9)`);
        gradient.addColorStop(0.5, `hsla(${hue + 20}, ${saturation}%, ${lightness - 10}%, 0.6)`);
        gradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.9)`);

        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.roundRect(x + barWidth * 0.2, centerY - barHeight, barWidth * 0.6, barHeight * 2, barWidth * 0.3);
        ctx.fill();

        ctx.shadowBlur = 20;
        ctx.shadowColor = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.5)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      phase += 0.02;

      if (isActive) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isActive]);

  return (
    <div className="h-full bg-slate-950 rounded-lg border border-slate-800 overflow-hidden flex flex-col">
      <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center gap-2">
        <Volume2 className="w-4 h-4 text-slate-400" />
        <span className="text-slate-300 text-sm font-medium">{title}</span>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => setIsActive(!isActive)}
            className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
          >
            {isActive ? 'Pause' : 'Resume'}
          </button>
          {type === 'microphone' ? (
            <Mic className={`w-3.5 h-3.5 text-${accentColor}-500`} />
          ) : (
            <Speaker className={`w-3.5 h-3.5 text-${accentColor}-500`} />
          )}
        </div>
      </div>

      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
        />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className={`w-32 h-32 rounded-full bg-${accentColor}-500/5 animate-pulse`}></div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 px-4 py-2 border-t border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-500">{type === 'microphone' ? 'Microphone input' : 'System audio output'}</span>
        <span className="text-slate-600">48kHz • 16-bit</span>
      </div>
    </div>
  );
}
