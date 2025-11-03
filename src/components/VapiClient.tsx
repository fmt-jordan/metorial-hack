import { useEffect, useRef, useState } from 'react';
import Vapi from '@vapi-ai/web';
import { Phone, Volume2, Mic } from 'lucide-react';
import Particles from './Particles';
import { useAgent } from '../contexts/AgentContext';

interface VapiClientProps {
  onEvent?: (type: string, message: string, data?: any) => void;
}

export default function VapiClient({ onEvent }: VapiClientProps) {
  const { selectedAssistant } = useAgent();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const vapiRef = useRef<Vapi | null>(null);

  useEffect(() => {
    const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY;

    if (!publicKey || publicKey === 'your_vapi_public_key_here') {
      console.warn('Vapi public key not configured');
      return;
    }

    const vapi = new Vapi(publicKey);
    vapiRef.current = vapi;

    vapi.on('call-start', () => {
      setIsConnected(true);
      setIsConnecting(false);
      onEvent?.('call-start', 'Call Started with AI Agent.');
    });

    vapi.on('call-end', () => {
      setIsConnected(false);
      setIsConnecting(false);
      onEvent?.('call-end', 'Call Ended with AI Agent.');
    });

    vapi.on('volume-level', (level: number) => {
      setVolumeLevel(level);
    });

    vapi.on('message', (message: any) => {
      if (message.type === 'transcript' && message.transcriptType === 'partial') {
        return;
      }

      if (message.type === 'transcript' && message.role === 'user') {
        onEvent?.('user-speech', `"${message.transcript}"`, { transcript: message.transcript });
      } else if (message.type === 'transcript' && message.role === 'assistant') {
        onEvent?.('agent-speech', `"${message.transcript}"`, { transcript: message.transcript });
      }
    });

    vapi.on('error', (error: Error) => {
      console.error('Vapi error:', error);
      setIsConnecting(false);
      setIsConnected(false);
    });

    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop();
      }
    };
  }, []);

  const startCall = async () => {
    if (!vapiRef.current) return;

    const assistantId = selectedAssistant?.assistant_id || import.meta.env.VITE_VAPI_ASSISTANT_ID;

    if (!assistantId || assistantId === 'your_vapi_assistant_id_here') {
      console.error('Vapi Assistant ID not configured');
      return;
    }

    setIsConnecting(true);
    try {
      await vapiRef.current.start(assistantId);
    } catch (error) {
      console.error('Failed to start call:', error);
      setIsConnecting(false);
    }
  };

  const endCall = () => {
    if (!vapiRef.current) return;
    vapiRef.current.stop();
  };

  const toggleMute = () => {
    if (!vapiRef.current) return;
    vapiRef.current.setMuted(!isMuted);
    setIsMuted(!isMuted);
  };

  return (
    <div className="h-full bg-slate-950 rounded-lg border border-slate-800 overflow-hidden flex flex-col">
      <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center gap-2">
        <Phone className="w-4 h-4 text-slate-400" />
        <span className="text-slate-300 text-sm font-medium">Booking Agent</span>
        <div className="ml-auto flex items-center gap-2">
          {isConnected && (
            <button
              onClick={toggleMute}
              className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <Mic className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <Mic className="w-3.5 h-3.5 text-emerald-500" />
              )}
            </button>
          )}
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0">
          <Particles
            particleColors={isConnected ? ['#10b981', '#34d399'] : ['#ffffff', '#ffffff']}
            particleCount={isConnected ? 400 : 200}
            particleSpread={isConnected ? 15 : 10}
            speed={isConnected ? 0.25 : 0.1}
            particleBaseSize={100}
            moveParticlesOnHover={true}
            alphaParticles={false}
            disableRotation={false}
          />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-8">
          <button
            onClick={isConnected ? endCall : startCall}
            disabled={isConnecting}
            className="relative group"
          >
            <div className={`relative w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all duration-300 cursor-pointer overflow-hidden ${
              isConnected
                ? 'border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20'
                : isConnecting
                ? 'border-slate-700 bg-slate-800/50 cursor-not-allowed'
                : 'border-slate-600 bg-slate-800/50 hover:bg-slate-700/50'
            }`}>
              {selectedAssistant?.profile_image_url && (
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-20"
                  style={{ backgroundImage: `url(${selectedAssistant.profile_image_url})` }}
                />
              )}
              {isConnected ? (
                <Phone className="w-12 h-12 text-emerald-500 relative z-10" />
              ) : isConnecting ? (
                <Phone className="w-12 h-12 text-slate-500 animate-pulse relative z-10" />
              ) : (
                <Phone className="w-12 h-12 text-white relative z-10" />
              )}
            </div>
            {isConnected && (
              <>
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/30 animate-ping"></div>
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20" style={{ animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite', animationDelay: '1s' }}></div>
              </>
            )}
            {!isConnected && !isConnecting && (
              <div className="absolute inset-0 rounded-full border-4 border-slate-500/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            )}
          </button>
        </div>
      </div>

      <div className="bg-slate-900/50 px-4 py-2 border-t border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-500">Powered by AI</span>
        <span className="text-slate-600">
          {isConnected ? 'Live' : 'Idle'}
        </span>
      </div>
    </div>
  );
}
