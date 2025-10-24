-- Vercel AI SDK Chat Schema Migration
-- Based on: https://github.com/vercel-labs/ai-sdk-persistence-db
-- Implements recommended structure for Vercel AI SDK message persistence

-- ============================================================================
-- CHATS TABLE
-- ============================================================================

-- Chats are conversation sessions
CREATE TABLE ai_chats (
  id TEXT PRIMARY KEY,

  -- User context
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL CHECK (user_type IN ('client', 'venue', 'vendor')),

  -- Agent configuration
  agent_type TEXT NOT NULL CHECK (agent_type IN ('client', 'venue_general', 'venue_event')),

  -- Context references (optional - depends on agent type)
  event_id UUID REFERENCES events(event_id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(venue_id) ON DELETE CASCADE,

  -- Chat metadata
  title TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Validation: ensure required context is present based on agent type
  CHECK (
    (agent_type = 'client' AND event_id IS NOT NULL) OR
    (agent_type = 'venue_general' AND venue_id IS NOT NULL) OR
    (agent_type = 'venue_event' AND event_id IS NOT NULL AND venue_id IS NOT NULL)
  )
);

COMMENT ON TABLE ai_chats IS 'Vercel AI SDK chat sessions';
COMMENT ON COLUMN ai_chats.agent_type IS 'Type of agent: client (event planning), venue_general (venue management), venue_event (specific event coordination)';

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================

-- Individual messages within chats
CREATE TABLE ai_messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL REFERENCES ai_chats(id) ON DELETE CASCADE,

  -- Message metadata
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE ai_messages IS 'Individual messages within AI chat sessions';
COMMENT ON COLUMN ai_messages.role IS 'Message role: user, assistant, or system';

-- ============================================================================
-- MESSAGE PARTS TABLE
-- ============================================================================

-- Message content using prefix-based columns for different data types
-- This avoids complex polymorphic relationships while maintaining type safety
CREATE TABLE ai_message_parts (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL REFERENCES ai_messages(id) ON DELETE CASCADE,

  -- Part metadata
  type TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Text content
  text_text TEXT,

  -- Reasoning/thinking content
  reasoning_text TEXT,

  -- File attachments
  file_mediaType TEXT,
  file_filename TEXT,
  file_url TEXT,

  -- Source URLs
  source_url_sourceId TEXT,
  source_url_url TEXT,
  source_url_title TEXT,

  -- Source documents
  source_document_sourceId TEXT,
  source_document_mediaType TEXT,
  source_document_title TEXT,
  source_document_filename TEXT,

  -- Tool call/result metadata
  tool_toolCallId TEXT,
  tool_state TEXT,
  tool_errorText TEXT,

  -- Tool-specific input/output (JSONB for flexibility)
  -- These would be expanded based on actual tools used
  tool_input JSONB,
  tool_output JSONB,

  -- Custom data parts
  data_content JSONB,

  -- Provider metadata
  providerMetadata JSONB,

  -- Check constraints to ensure required fields are present
  CONSTRAINT check_text_part CHECK (
    type != 'text' OR (text_text IS NOT NULL)
  ),
  CONSTRAINT check_reasoning_part CHECK (
    type != 'reasoning' OR (reasoning_text IS NOT NULL)
  ),
  CONSTRAINT check_file_part CHECK (
    type != 'file' OR (
      file_mediaType IS NOT NULL AND
      file_filename IS NOT NULL AND
      file_url IS NOT NULL
    )
  ),
  CONSTRAINT check_source_url_part CHECK (
    type != 'source-url' OR (
      source_url_url IS NOT NULL AND
      source_url_title IS NOT NULL
    )
  ),
  CONSTRAINT check_source_document_part CHECK (
    type != 'source-document' OR (
      source_document_mediaType IS NOT NULL AND
      source_document_title IS NOT NULL
    )
  ),
  CONSTRAINT check_tool_call_part CHECK (
    type != 'tool-call' OR (
      tool_toolCallId IS NOT NULL AND
      tool_input IS NOT NULL
    )
  ),
  CONSTRAINT check_tool_result_part CHECK (
    type != 'tool-result' OR (
      tool_toolCallId IS NOT NULL AND
      tool_output IS NOT NULL
    )
  )
);

COMMENT ON TABLE ai_message_parts IS 'Message content parts using prefix-based columns for type safety';
COMMENT ON COLUMN ai_message_parts.type IS 'Part type: text, reasoning, file, source-url, source-document, tool-call, tool-result, data, etc.';
COMMENT ON COLUMN ai_message_parts."order" IS 'Sequence order within the message';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Chat indexes
CREATE INDEX idx_ai_chats_user ON ai_chats(user_id, user_type);
CREATE INDEX idx_ai_chats_event ON ai_chats(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX idx_ai_chats_venue ON ai_chats(venue_id) WHERE venue_id IS NOT NULL;
CREATE INDEX idx_ai_chats_created_at ON ai_chats(created_at DESC);
CREATE INDEX idx_ai_chats_updated_at ON ai_chats(updated_at DESC);

-- Message indexes
CREATE INDEX idx_ai_messages_chat_id ON ai_messages(chat_id);
CREATE INDEX idx_ai_messages_chat_id_created_at ON ai_messages(chat_id, created_at);
CREATE INDEX idx_ai_messages_created_at ON ai_messages(created_at DESC);

-- Part indexes
CREATE INDEX idx_ai_message_parts_message_id ON ai_message_parts(message_id);
CREATE INDEX idx_ai_message_parts_message_id_order ON ai_message_parts(message_id, "order");
CREATE INDEX idx_ai_message_parts_type ON ai_message_parts(type);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger for updating updated_at on ai_chats
CREATE TRIGGER update_ai_chats_updated_at BEFORE UPDATE ON ai_chats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE ai_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_message_parts ENABLE ROW LEVEL SECURITY;

-- Chat Policies
-- Users can only see their own chats
CREATE POLICY "Users view own ai chats"
  ON ai_chats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own ai chats"
  ON ai_chats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own ai chats"
  ON ai_chats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own ai chats"
  ON ai_chats FOR DELETE
  USING (auth.uid() = user_id);

-- Message Policies
-- Users can see messages in their chats
CREATE POLICY "Users view ai messages in own chats"
  ON ai_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_chats
      WHERE ai_chats.id = ai_messages.chat_id
        AND ai_chats.user_id = auth.uid()
    )
  );

CREATE POLICY "Users insert ai messages in own chats"
  ON ai_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_chats
      WHERE ai_chats.id = ai_messages.chat_id
        AND ai_chats.user_id = auth.uid()
    )
  );

CREATE POLICY "Users update ai messages in own chats"
  ON ai_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM ai_chats
      WHERE ai_chats.id = ai_messages.chat_id
        AND ai_chats.user_id = auth.uid()
    )
  );

CREATE POLICY "Users delete ai messages in own chats"
  ON ai_messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM ai_chats
      WHERE ai_chats.id = ai_messages.chat_id
        AND ai_chats.user_id = auth.uid()
    )
  );

-- Part Policies
-- Users can see parts in their messages
CREATE POLICY "Users view ai message parts in own chats"
  ON ai_message_parts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_messages
      INNER JOIN ai_chats ON ai_chats.id = ai_messages.chat_id
      WHERE ai_messages.id = ai_message_parts.message_id
        AND ai_chats.user_id = auth.uid()
    )
  );

CREATE POLICY "Users insert ai message parts in own chats"
  ON ai_message_parts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_messages
      INNER JOIN ai_chats ON ai_chats.id = ai_messages.chat_id
      WHERE ai_messages.id = ai_message_parts.message_id
        AND ai_chats.user_id = auth.uid()
    )
  );

CREATE POLICY "Users update ai message parts in own chats"
  ON ai_message_parts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM ai_messages
      INNER JOIN ai_chats ON ai_chats.id = ai_messages.chat_id
      WHERE ai_messages.id = ai_message_parts.message_id
        AND ai_chats.user_id = auth.uid()
    )
  );

CREATE POLICY "Users delete ai message parts in own chats"
  ON ai_message_parts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM ai_messages
      INNER JOIN ai_chats ON ai_chats.id = ai_messages.chat_id
      WHERE ai_messages.id = ai_message_parts.message_id
        AND ai_chats.user_id = auth.uid()
    )
  );

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

-- This migration creates the Vercel AI SDK compatible schema.
-- The existing `chatkit_*` tables remain for backwards compatibility.
--
-- Key differences:
-- 1. Simpler structure (chats -> messages -> parts vs threads -> items)
-- 2. Prefix-based columns avoid polymorphic relationships
-- 3. Optimized for Vercel AI SDK's UIMessage format
-- 4. Better performance for typical chat operations
