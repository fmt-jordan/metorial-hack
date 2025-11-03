import { useEffect, useRef, useState } from 'react';
import { Terminal } from 'lucide-react';

interface WebhookEvent {
  id: string;
  timestamp: Date;
  type: string;
  message: string;
  data?: any;
}

interface WebhookConsoleProps {
  latestEventId?: string | null;
  onAddEvent?: (callback: (type: string, message: string, data?: any) => void) => void;
  onWebhookClick?: (eventId: string) => void;
}

export default function WebhookConsole({ latestEventId, onAddEvent, onWebhookClick }: WebhookConsoleProps) {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEvents([]);
  }, []);

  useEffect(() => {
    if (onAddEvent) {
      const addEventCallback = (type: string, message: string, data?: any) => {
        setEvents(prev => [
          {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date(),
            type,
            message,
            data
          },
          ...prev.slice(0, 49)
        ]);
      };
      onAddEvent(addEventCallback);
    }
  }, [onAddEvent]);

  useEffect(() => {
    if (latestEventId) {
      setEvents(prev => [
        {
          id: latestEventId,
          timestamp: new Date(),
          type: 'webhook',
          message: 'New quote webhook received',
          data: { eventId: latestEventId }
        },
        ...prev.slice(0, 49)
      ]);
    }
  }, [latestEventId]);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = 0;
    }
  }, [events]);

  const getEventColor = (type: string) => {
    switch (type) {
      case 'connection':
        return 'text-green-400';
      case 'speech':
        return 'text-cyan-400';
      case 'processing':
        return 'text-yellow-400';
      case 'response':
        return 'text-blue-400';
      case 'speaking':
        return 'text-purple-400';
      case 'call-start':
        return 'text-green-400';
      case 'call-end':
        return 'text-red-400';
      case 'user-speech':
        return 'text-cyan-400';
      case 'agent-speech':
        return 'text-blue-400';
      case 'webhook':
        return 'text-teal-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getEventPrefix = (type: string) => {
    switch (type) {
      case 'connection':
        return '→';
      case 'speech':
        return '🎤';
      case 'processing':
        return '⚙';
      case 'response':
        return '💬';
      case 'speaking':
        return '🔊';
      case 'call-start':
        return '📞';
      case 'call-end':
        return '📴';
      case 'user-speech':
        return '🎤';
      case 'agent-speech':
        return '🤖';
      case 'webhook':
        return '📧';
      case 'error':
        return '✗';
      default:
        return '•';
    }
  };

  return (
    <div className="h-full bg-slate-950 rounded-lg border border-slate-800 overflow-hidden flex flex-col">
      <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center gap-2">
        <Terminal className="w-4 h-4 text-slate-400" />
        <span className="text-slate-300 text-sm font-medium">Agent Monitor</span>
        <div className="ml-auto flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs text-slate-500">Live</span>
        </div>
      </div>

      <div
        ref={consoleRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900"
      >
        {events.map((event) => (
          <div
            key={event.id}
            className={`group -mx-2 px-2 py-1 rounded transition-colors ${
              event.type === 'webhook'
                ? 'hover:bg-slate-900/70 cursor-pointer'
                : 'hover:bg-slate-900/50'
            }`}
            onClick={() => {
              if (event.type === 'webhook' && event.data?.eventId && onWebhookClick) {
                onWebhookClick(event.data.eventId);
              }
            }}
          >
            <div className="flex items-start gap-2">
              <span className="text-slate-600 select-none">
                {event.timestamp.toLocaleTimeString('en-US', {
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </span>
              <span className={`${getEventColor(event.type)} select-none`}>
                {getEventPrefix(event.type)}
              </span>
              <span className={`${getEventColor(event.type)} flex-1`}>
                [{event.type.toUpperCase()}]
              </span>
              {event.type === 'webhook' && (
                <span className="text-slate-500 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to view details
                </span>
              )}
            </div>
            <div className="ml-[90px] text-slate-300 mt-0.5">
              {event.message}
            </div>
            {event.data && event.type !== 'user-speech' && event.type !== 'agent-speech' && event.type !== 'webhook' && (
              <div className="ml-[90px] text-slate-500 mt-1 text-[10px]">
                {JSON.stringify(event.data, null, 2)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
