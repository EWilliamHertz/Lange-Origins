import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send } from 'lucide-react';

export type ChatChannel = 'all' | 'zone' | 'party' | 'trade' | 'system';

export interface ChatMessage {
  id?: string;
  sender: string;
  text: string;
  channel?: ChatChannel;
  timestamp?: number;
}

interface ChannelChatProps {
  messages: ChatMessage[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSendMessage: (text: string, channel: ChatChannel) => void;
}

export const ChannelChat: React.FC<ChannelChatProps> = ({
  messages,
  isOpen,
  onOpenChange,
  onSendMessage,
}) => {
  const [activeChannel, setActiveChannel] = useState<ChatChannel>('all');
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeChannel]);

  const filteredMessages = messages.filter(m => {
    if (activeChannel === 'all') return true;
    return (m.channel || 'zone') === activeChannel || m.channel === 'system';
  });

  const getChannelBadge = (channel?: ChatChannel) => {
    switch (channel) {
      case 'party':
        return (
          <span className="px-1 py-0.2 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
            [Party]
          </span>
        );
      case 'trade':
        return (
          <span className="px-1 py-0.2 rounded text-[10px] font-bold bg-amber-950/80 text-amber-400 border border-amber-500/30">
            [Trade]
          </span>
        );
      case 'system':
        return (
          <span className="px-1 py-0.2 rounded text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-500/30">
            [System]
          </span>
        );
      case 'zone':
      default:
        return (
          <span className="px-1 py-0.2 rounded text-[10px] font-bold bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
            [Zone]
          </span>
        );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = inputText.trim();
    if (!raw) return;

    let targetChannel = activeChannel === 'all' ? 'zone' : activeChannel;
    let cleanText = raw;

    if (raw.startsWith('/p ') || raw.startsWith('/party ')) {
      targetChannel = 'party';
      cleanText = raw.replace(/^\/(p|party)\s+/, '');
    } else if (raw.startsWith('/t ') || raw.startsWith('/trade ')) {
      targetChannel = 'trade';
      cleanText = raw.replace(/^\/(t|trade)\s+/, '');
    } else if (raw.startsWith('/z ') || raw.startsWith('/zone ')) {
      targetChannel = 'zone';
      cleanText = raw.replace(/^\/(z|zone)\s+/, '');
    }

    if (cleanText) {
      onSendMessage(cleanText, targetChannel as ChatChannel);
    }
    setInputText('');
    onOpenChange(false);
  };

  return (
    <div
      id="channel-chat-system"
      className="absolute bottom-24 left-4 w-80 sm:w-96 z-20 flex flex-col justify-end pointer-events-none select-none"
    >
      {/* Messages Container */}
      <div
        className={`flex flex-col gap-1 mb-2 max-h-56 overflow-y-auto p-1.5 transition-all ${
          isOpen ? 'bg-neutral-950/85 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl pointer-events-auto' : ''
        }`}
        ref={scrollRef}
      >
        {/* Channel Selection Tabs (visible when open) */}
        {isOpen && (
          <div className="flex items-center gap-1 mb-1 pb-1.5 border-b border-white/10">
            {(['all', 'zone', 'party', 'trade'] as ChatChannel[]).map(tab => {
              const isSelected = activeChannel === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveChannel(tab)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    isSelected
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        )}

        {/* Message feed */}
        {filteredMessages.slice(-25).map((msg, idx) => (
          <div
            key={msg.id || idx}
            className="bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg w-fit max-w-full break-words border border-white/5 flex items-start gap-1.5"
          >
            {getChannelBadge(msg.channel)}
            <span className="font-bold text-neutral-400 shrink-0 text-[11px]">{msg.sender}:</span>
            <span className="text-neutral-200 text-[11px] leading-relaxed">{msg.text}</span>
          </div>
        ))}
      </div>

      {/* Input Bar */}
      {isOpen ? (
        <form
          onSubmit={handleSubmit}
          className="pointer-events-auto bg-neutral-950/90 backdrop-blur-md p-2 rounded-xl border border-white/15 flex items-center shadow-2xl gap-2"
        >
          {getChannelBadge(activeChannel === 'all' ? 'zone' : activeChannel)}
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            className="bg-transparent text-white outline-none w-full text-xs placeholder:text-neutral-500"
            placeholder={`Type a message in [${activeChannel.toUpperCase()}] or /p, /t, /z...`}
            onBlur={() => {
              if (!inputText) onOpenChange(false);
            }}
            maxLength={140}
          />
          <button
            type="submit"
            className="p-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white shrink-0 transition-colors"
          >
            <Send size={13} />
          </button>
        </form>
      ) : (
        <div
          onClick={() => onOpenChange(true)}
          className="pointer-events-auto cursor-pointer text-white/50 hover:text-white text-xs ml-1 flex items-center gap-1.5 drop-shadow-md w-fit bg-neutral-950/60 px-2.5 py-1 rounded-lg border border-white/10"
        >
          <MessageSquare size={13} className="text-cyan-400" />
          <span>Press Enter to chat</span>
        </div>
      )}
    </div>
  );
};
