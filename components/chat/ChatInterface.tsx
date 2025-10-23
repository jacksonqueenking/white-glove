'use client';

/**
 * Chat Interface Component
 *
 * Modern chat interface using Vercel AI SDK's useChat hook.
 * Replaces the OpenAI ChatKit implementation.
 */

import { useChat } from '@ai-sdk/react';
import { useState, useEffect, useRef } from 'react';

interface ChatInterfaceProps {
  /** Type of agent to use */
  agentType: 'client' | 'venue_general' | 'venue_event';
  /** Event ID (required for client and venue_event agents) */
  eventId?: string;
  /** Venue ID (required for venue agents) */
  venueId?: string;
  /** Chat ID for loading existing conversations */
  chatId?: string;
  /** Initial messages for restoring chat history */
  initialMessages?: any[];
  /** Optional CSS classes */
  className?: string;
  /** Chat window title */
  title?: string;
  /** Chat window subtitle */
  subtitle?: string;
}

export function ChatInterface({
  agentType,
  eventId,
  venueId,
  chatId,
  initialMessages = [],
  className = 'h-[600px] w-full',
  title,
  subtitle,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use Vercel AI SDK's useChat hook
  const {
    messages,
    isLoading,
    error,
    append,
    reload,
    stop,
  } = useChat({
    api: '/api/chat',
    id: chatId || `chat-${Date.now()}`,
    initialMessages,
    body: {
      agentType,
      eventId,
      venueId,
    },
    onError: (error) => {
      console.error('[ChatInterface] Error:', error);
    },
    onFinish: (message) => {
      console.log('[ChatInterface] Message finished:', message);
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    await append({
      role: 'user',
      content: userMessage,
    });
  };

  // Get display title and subtitle
  const displayTitle = title || getDefaultTitle(agentType);
  const displaySubtitle = subtitle || getDefaultSubtitle(agentType);

  return (
    <div className={`flex flex-col bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-[#f0bda4] to-[#e8a88c]">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{displayTitle}</h2>
          <p className="text-sm text-gray-700">{displaySubtitle}</p>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-lg font-medium text-gray-600">Start a conversation</p>
              <p className="text-sm text-gray-500 mt-2">{displaySubtitle}</p>
            </div>
            {getStarterPrompts(agentType).length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {getStarterPrompts(agentType).map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInput(prompt.prompt);
                    }}
                    className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    {prompt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-[#f0bda4] text-gray-900'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 max-w-md">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-red-800">
                    {error.message || 'An error occurred while processing your message.'}
                  </p>
                  <button
                    onClick={() => reload()}
                    className="text-sm text-red-600 hover:text-red-700 underline mt-2"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="border-t bg-gray-50 px-6 py-4">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder={displaySubtitle}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f0bda4] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          {isLoading ? (
            <button
              type="button"
              onClick={() => stop()}
              className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 bg-[#f0bda4] text-gray-900 rounded-lg hover:bg-[#e8a88c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Send
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

/**
 * Get default title based on agent type
 */
function getDefaultTitle(agentType: string): string {
  switch (agentType) {
    case 'client':
      return 'White Glove Assistant';
    case 'venue_general':
      return 'Venue Management Assistant';
    case 'venue_event':
      return 'Event Coordinator';
    default:
      return 'AI Assistant';
  }
}

/**
 * Get default subtitle based on agent type
 */
function getDefaultSubtitle(agentType: string): string {
  switch (agentType) {
    case 'client':
      return 'Chat naturally and I\'ll coordinate updates with your venue and vendors automatically.';
    case 'venue_general':
      return 'Ask me anything about your venue operations...';
    case 'venue_event':
      return 'How can I help with this event?';
    default:
      return 'How can I help you today?';
  }
}

/**
 * Get starter prompts based on agent type
 */
function getStarterPrompts(agentType: string) {
  switch (agentType) {
    case 'client':
      return [
        { label: 'Plan my event', prompt: 'Help me start planning my event' },
        { label: 'Check status', prompt: 'What\'s the current status of my event planning?' },
        { label: 'Make changes', prompt: 'I\'d like to make some changes to my event' },
      ];
    case 'venue_general':
      return [
        { label: 'View events', prompt: 'Show me upcoming events' },
        { label: 'Manage vendors', prompt: 'Help me manage vendor relationships' },
        { label: 'Venue info', prompt: 'Tell me about my venue capabilities' },
      ];
    case 'venue_event':
      return [
        { label: 'Event details', prompt: 'Give me the current event details' },
        { label: 'Coordinate vendors', prompt: 'Help me coordinate with vendors for this event' },
        { label: 'Client updates', prompt: 'Are there any updates from the client?' },
      ];
    default:
      return [];
  }
}
