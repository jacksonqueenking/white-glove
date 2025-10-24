'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getEventAIChats, type AIChat } from '@/lib/db/ai-chat';
import { PlusIcon } from 'lucide-react';
import { nanoid } from 'nanoid';

interface ChatListProps {
  eventId: string;
  mode: 'client' | 'venue';
}

export function ChatList({ eventId, mode }: ChatListProps) {
  const router = useRouter();
  const params = useParams();
  const currentChatId = params?.chatId as string | undefined;

  const [chats, setChats] = useState<AIChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const loadChats = async () => {
      try {
        const eventChats = await getEventAIChats(supabase, eventId);
        setChats(eventChats);
      } catch (error) {
        console.error('Failed to load chats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChats();
  }, [eventId, supabase]);

  const handleNewChat = () => {
    const newChatId = nanoid();
    const basePath = mode === 'client' ? '/client' : '/venue';
    router.push(`${basePath}/events/${eventId}/chats/${newChatId}`);
  };

  const handleSelectChat = (chatId: string) => {
    const basePath = mode === 'client' ? '/client' : '/venue';
    router.push(`${basePath}/events/${eventId}/chats/${chatId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-xs text-[#b09c86]">Loading chats...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#f8f4ec]">
      {/* Header */}
      <div className="border-b border-[#e7dfd4] px-4 py-4">
        <button
          onClick={handleNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#3f3a33] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#2d2923]"
        >
          <PlusIcon size={16} />
          New Chat
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4">
            <p className="text-center text-xs text-[#b09c86]">
              No conversations yet.<br />Start a new chat above.
            </p>
          </div>
        ) : (
          <div className="py-2">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => handleSelectChat(chat.id)}
                className={[
                  'flex w-full flex-col items-start gap-1 border-l-2 px-4 py-3 text-left transition',
                  currentChatId === chat.id
                    ? 'border-[#c96f3a] bg-[#fef5ed]'
                    : 'border-transparent hover:bg-[#f1ebe0]',
                ].join(' ')}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-[#3f3a33]">
                    {chat.title || 'Untitled Chat'}
                  </span>
                  <span className="shrink-0 text-[10px] text-[#b09c86]">
                    {formatDate(chat.updated_at)}
                  </span>
                </div>
                {chat.title && (
                  <span className="text-xs text-[#8e806c] line-clamp-1">
                    Last active {formatDate(chat.updated_at)}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
