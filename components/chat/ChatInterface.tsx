'use client';

import {
  Branch,
  BranchMessages,
  BranchNext,
  BranchPage,
  BranchPrevious,
  BranchSelector,
} from '@/components/ai-elements/branch';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  type PromptInputMessage,
  PromptInputSpeechButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import {
  Message,
  MessageAvatar,
  MessageContent,
} from '@/components/ai-elements/message';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
import { Response } from '@/components/ai-elements/response';
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/sources';
import {
  Suggestion,
  Suggestions,
} from '@/components/ai-elements/suggestion';
import { GlobeIcon } from 'lucide-react';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import type { ToolUIPart, UIMessage } from 'ai';
import { nanoid } from 'nanoid';
import { useChat } from '@ai-sdk/react';

interface ChatInterfaceProps {
  agentType: 'client' | 'venue_general' | 'venue_event';
  eventId?: string;
  venueId?: string;
  chatId?: string;
  className?: string;
  title?: string;
  subtitle?: string;
}

const getInitialMessages = (agentType: string): UIMessage[] => {
  const welcomeMessages: Record<string, string> = {
    client: "Welcome! I'm your White Glove Assistant. I can help you coordinate your event details, communicate with your venue, and keep track of all the important aspects of your celebration. How can I help you today?",
    venue_general: "Hello! I'm your venue management assistant. I can help you manage inquiries, bookings, event details, and coordinate with clients. What would you like to work on?",
    venue_event: "Hi! I'm here to help coordinate this event. I can assist with event details, client communication, vendor coordination, and timeline management. What do you need help with?",
  };

  return [
    {
      id: nanoid(),
      role: 'assistant',
      parts: [
        {
          type: 'text',
          text: welcomeMessages[agentType] || "Hello! How can I assist you today?",
        },
      ],
    },
  ];
};

const getSuggestions = (agentType: string): string[] => {
  const suggestionsByType: Record<string, string[]> = {
    client: [
      'What details do I need to finalize for my event?',
      'Can you help me communicate with my venue?',
      'What vendors do I still need to book?',
      'Show me my event timeline',
      'What are the next steps for planning?',
    ],
    venue_general: [
      'Show me recent inquiries',
      'What events are coming up this week?',
      'Help me respond to a client question',
      'What bookings need attention?',
      'Show me venue availability',
    ],
    venue_event: [
      'What are the event details?',
      'What does the client need from us?',
      'Show me the event timeline',
      'What vendors are involved?',
      'Help me coordinate with the client',
    ],
  };

  return suggestionsByType[agentType] || [
    'How can you help me?',
    'What can I ask you?',
  ];
};

export function ChatInterface({
  agentType,
  eventId,
  venueId,
  chatId,
  className,
  title,
  subtitle,
}: ChatInterfaceProps) {
  const [text, setText] = useState<string>('');
  const [useWebSearch, setUseWebSearch] = useState<boolean>(false);
  const [systemPrompt, setSystemPrompt] = useState<string | null>(null);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState<boolean>(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasFetchedPrompt = useRef<boolean>(false);

  console.log('[ChatInterface] Render - systemPrompt:', systemPrompt ? 'loaded' : 'not loaded');

  // Pre-build system prompt on mount (only once)
  useEffect(() => {
    if (hasFetchedPrompt.current) {
      console.log('[ChatInterface] Skipping prompt fetch - already loaded');
      return;
    }

    const fetchSystemPrompt = async () => {
      console.log('[ChatInterface] Fetching system prompt...');
      setIsLoadingPrompt(true);
      hasFetchedPrompt.current = true;

      try {
        const response = await fetch('/api/chat/context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agentType, eventId, venueId }),
        });

        if (response.ok) {
          const data = await response.json();
          setSystemPrompt(data.systemPrompt);
          console.log('[ChatInterface] System prompt pre-loaded, length:', data.systemPrompt?.length);
        } else {
          console.error('[ChatInterface] Failed to pre-load system prompt, status:', response.status);
        }
      } catch (error) {
        console.error('[ChatInterface] Error pre-loading system prompt:', error);
      } finally {
        setIsLoadingPrompt(false);
      }
    };

    fetchSystemPrompt();
  }, [agentType, eventId, venueId]);

  // Use the Vercel AI SDK's useChat hook
  const { messages, sendMessage, status, stop, setMessages } = useChat({
    id: chatId || `chat-${agentType}-${eventId || venueId}`,
    onError: (error) => {
      console.error('[ChatInterface] Error:', error);
      toast.error('Failed to send message', {
        description: error.message,
      });
    },
  });

  // Set initial messages if there are none
  useEffect(() => {
    if (messages.length === 0) {
      setMessages(getInitialMessages(agentType));
    }
  }, [messages.length, agentType, setMessages]);

  console.log('[ChatInterface] Messages:', messages);
  console.log('[ChatInterface] Status:', status);

  const handleSubmit = (message: PromptInputMessage) => {
    console.log('[ChatInterface] handleSubmit called with:', message);

    // If currently streaming or submitted, stop instead of submitting
    if (status === 'streaming' || status === 'submitted') {
      console.log('[ChatInterface] Stopping because status is:', status);
      stop();
      return;
    }

    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      console.log('[ChatInterface] No text or attachments, returning');
      return;
    }

    if (message.files?.length) {
      toast.success('Files attached', {
        description: `${message.files.length} file(s) attached to message`,
      });
    }

    console.log('[ChatInterface] Calling sendMessage with:', {
      text: message.text,
      body: { agentType, eventId, venueId, systemPrompt: systemPrompt ? 'pre-loaded' : 'will build' },
    });

    sendMessage({ text: message.text || 'Sent with attachments' }, {
      body: {
        agentType,
        eventId,
        venueId,
        systemPrompt, // Pass pre-built prompt if available
      },
    });
    setText('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage({ text: suggestion }, {
      body: {
        agentType,
        eventId,
        venueId,
        systemPrompt, // Pass pre-built prompt if available
      },
    });
  };

  return (
    <div className="relative flex size-full flex-col divide-y overflow-hidden">
      <Conversation>
        <ConversationContent>
          {messages.map((message) => {
            console.log('[ChatInterface] Rendering message:', message);
            return (
              <Message
                from={message.role}
                key={message.id}
              >
                <MessageContent variant="flat">
                  {message.parts.map((part, i) => {
                    if (part.type === 'text') {
                      return <Response key={i}>{part.text}</Response>;
                    }
                    return null;
                  })}
                </MessageContent>
              </Message>
            );
          })}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="grid shrink-0 gap-4 pt-4">
        <Suggestions className="px-4">
          {getSuggestions(agentType).map((suggestion) => (
            <Suggestion
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              suggestion={suggestion}
            />
          ))}
        </Suggestions>
        <div className="w-full px-4 pb-4">
          <PromptInput globalDrop multiple onSubmit={handleSubmit}>
            <PromptInputBody>
              <PromptInputAttachments>
                {(attachment) => <PromptInputAttachment data={attachment} />}
              </PromptInputAttachments>
              <PromptInputTextarea
                onChange={(event) => setText(event.target.value)}
                ref={textareaRef}
                value={text}
              />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
                <PromptInputSpeechButton
                  onTranscriptionChange={setText}
                  textareaRef={textareaRef}
                />
                <PromptInputButton
                  onClick={() => setUseWebSearch(!useWebSearch)}
                  variant={useWebSearch ? 'default' : 'ghost'}
                >
                  <GlobeIcon size={16} />
                  <span>Search</span>
                </PromptInputButton>
              </PromptInputTools>
              <PromptInputSubmit
                disabled={isLoadingPrompt || (!text.trim() && !status) || status === 'streaming'}
                status={status}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
