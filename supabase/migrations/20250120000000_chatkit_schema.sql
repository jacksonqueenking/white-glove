-- ChatKit Schema Migration
-- Implements the ChatKit protocol data storage requirements
-- Based on: https://github.com/openai/chatkit-python/blob/main/docs/server.md

-- ============================================================================
-- CHATKIT THREADS
-- ============================================================================

-- ChatKit threads (distinct from human message threads)
CREATE TABLE chatkit_threads (
  thread_id TEXT PRIMARY KEY, -- ChatKit uses string IDs like "thread_abc123"

  -- User context
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL CHECK (user_type IN ('client', 'venue', 'vendor')),

  -- Event context (optional - thread may be general or event-specific)
  event_id UUID REFERENCES events(event_id) ON DELETE SET NULL,
  venue_id UUID REFERENCES venues(venue_id) ON DELETE SET NULL,

  -- Agent configuration (stored as metadata)
  agent_type TEXT NOT NULL CHECK (agent_type IN ('client', 'venue_general', 'venue_event')),

  -- Thread metadata
  title TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Soft delete
  deleted_at TIMESTAMPTZ,

  -- Indexes inline
  CHECK (
    (agent_type = 'client' AND event_id IS NOT NULL) OR
    (agent_type = 'venue_general' AND venue_id IS NOT NULL) OR
    (agent_type = 'venue_event' AND event_id IS NOT NULL AND venue_id IS NOT NULL)
  )
);

COMMENT ON TABLE chatkit_threads IS 'ChatKit conversation threads following OpenAI ChatKit protocol';
COMMENT ON COLUMN chatkit_threads.agent_type IS 'Type of agent: client (event planning), venue_general (venue management), venue_event (specific event coordination)';
COMMENT ON COLUMN chatkit_threads.metadata IS 'Additional metadata for the thread (key-value pairs)';

-- ============================================================================
-- CHATKIT THREAD ITEMS
-- ============================================================================

-- ChatKit thread items (messages, widgets, tool calls, etc.)
CREATE TABLE chatkit_thread_items (
  item_id TEXT PRIMARY KEY, -- ChatKit uses string IDs like "msg_abc123"
  thread_id TEXT NOT NULL REFERENCES chatkit_threads(thread_id) ON DELETE CASCADE,

  -- Item type and role
  item_type TEXT NOT NULL CHECK (item_type IN (
    'message',           -- User or assistant message
    'widget',            -- Custom UI widget
    'client_tool_call',  -- Client-side tool invocation
    'client_tool_result',-- Client-side tool result
    'hidden'             -- Hidden context item
  )),
  role TEXT CHECK (role IN ('user', 'assistant', 'system')), -- NULL for non-message items

  -- Content (stored as JSONB for flexibility)
  -- For messages: {type: 'text', text: '...'}
  -- For widgets: {widget data}
  -- For tool calls: {name, params, result}
  content JSONB NOT NULL,

  -- Status (for items that have progress)
  status TEXT CHECK (status IN ('in_progress', 'completed', 'failed', 'cancelled')),

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Order within thread
  sequence_number INTEGER NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Soft delete
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE chatkit_thread_items IS 'Items within ChatKit threads (messages, widgets, tool calls, etc.)';
COMMENT ON COLUMN chatkit_thread_items.content IS 'Content structure varies by item_type. See ChatKit protocol docs.';
COMMENT ON COLUMN chatkit_thread_items.sequence_number IS 'Order of items within thread for correct display';

-- ============================================================================
-- CHATKIT ATTACHMENTS
-- ============================================================================

-- ChatKit attachments (files, images)
CREATE TABLE chatkit_attachments (
  attachment_id TEXT PRIMARY KEY, -- ChatKit uses string IDs like "att_abc123"
  thread_id TEXT NOT NULL REFERENCES chatkit_threads(thread_id) ON DELETE CASCADE,
  item_id TEXT REFERENCES chatkit_thread_items(item_id) ON DELETE CASCADE,

  -- File info
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL, -- bytes

  -- Storage
  storage_path TEXT NOT NULL, -- Supabase Storage path
  storage_url TEXT, -- Public URL (if applicable)

  -- Upload info
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  upload_status TEXT NOT NULL DEFAULT 'pending' CHECK (upload_status IN (
    'pending',    -- Upload initiated but not complete
    'uploading',  -- In progress
    'completed',  -- Successfully uploaded
    'failed'      -- Upload failed
  )),

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Soft delete
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE chatkit_attachments IS 'File attachments for ChatKit threads following OpenAI ChatKit protocol';
COMMENT ON COLUMN chatkit_attachments.storage_path IS 'Path in Supabase Storage bucket';
COMMENT ON COLUMN chatkit_attachments.upload_status IS 'Track upload progress for two-phase uploads';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- ChatKit threads indexes
CREATE INDEX idx_chatkit_threads_user ON chatkit_threads(user_id, user_type);
CREATE INDEX idx_chatkit_threads_event ON chatkit_threads(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX idx_chatkit_threads_venue ON chatkit_threads(venue_id) WHERE venue_id IS NOT NULL;
CREATE INDEX idx_chatkit_threads_created_at ON chatkit_threads(created_at DESC);
CREATE INDEX idx_chatkit_threads_updated_at ON chatkit_threads(updated_at DESC);
CREATE INDEX idx_chatkit_threads_deleted_at ON chatkit_threads(deleted_at) WHERE deleted_at IS NULL;

-- ChatKit thread items indexes
CREATE INDEX idx_chatkit_thread_items_thread ON chatkit_thread_items(thread_id, sequence_number);
CREATE INDEX idx_chatkit_thread_items_type ON chatkit_thread_items(item_type);
CREATE INDEX idx_chatkit_thread_items_role ON chatkit_thread_items(role) WHERE role IS NOT NULL;
CREATE INDEX idx_chatkit_thread_items_created_at ON chatkit_thread_items(created_at DESC);
CREATE INDEX idx_chatkit_thread_items_deleted_at ON chatkit_thread_items(deleted_at) WHERE deleted_at IS NULL;

-- ChatKit attachments indexes
CREATE INDEX idx_chatkit_attachments_thread ON chatkit_attachments(thread_id);
CREATE INDEX idx_chatkit_attachments_item ON chatkit_attachments(item_id) WHERE item_id IS NOT NULL;
CREATE INDEX idx_chatkit_attachments_uploaded_by ON chatkit_attachments(uploaded_by);
CREATE INDEX idx_chatkit_attachments_status ON chatkit_attachments(upload_status);
CREATE INDEX idx_chatkit_attachments_deleted_at ON chatkit_attachments(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger for updating updated_at on chatkit_threads
CREATE TRIGGER update_chatkit_threads_updated_at BEFORE UPDATE ON chatkit_threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updating updated_at on chatkit_attachments
CREATE TRIGGER update_chatkit_attachments_updated_at BEFORE UPDATE ON chatkit_attachments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE chatkit_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatkit_thread_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatkit_attachments ENABLE ROW LEVEL SECURITY;

-- ChatKit Threads Policies
-- Users can only see their own threads
CREATE POLICY "Users view own chatkit threads"
  ON chatkit_threads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own chatkit threads"
  ON chatkit_threads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own chatkit threads"
  ON chatkit_threads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own chatkit threads"
  ON chatkit_threads FOR DELETE
  USING (auth.uid() = user_id);

-- ChatKit Thread Items Policies
-- Users can see items in their threads
CREATE POLICY "Users view chatkit thread items in own threads"
  ON chatkit_thread_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chatkit_threads
      WHERE chatkit_threads.thread_id = chatkit_thread_items.thread_id
        AND chatkit_threads.user_id = auth.uid()
    )
  );

CREATE POLICY "Users insert chatkit thread items in own threads"
  ON chatkit_thread_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chatkit_threads
      WHERE chatkit_threads.thread_id = chatkit_thread_items.thread_id
        AND chatkit_threads.user_id = auth.uid()
    )
  );

CREATE POLICY "Users update chatkit thread items in own threads"
  ON chatkit_thread_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM chatkit_threads
      WHERE chatkit_threads.thread_id = chatkit_thread_items.thread_id
        AND chatkit_threads.user_id = auth.uid()
    )
  );

CREATE POLICY "Users delete chatkit thread items in own threads"
  ON chatkit_thread_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM chatkit_threads
      WHERE chatkit_threads.thread_id = chatkit_thread_items.thread_id
        AND chatkit_threads.user_id = auth.uid()
    )
  );

-- ChatKit Attachments Policies
-- Users can see attachments in their threads
CREATE POLICY "Users view chatkit attachments in own threads"
  ON chatkit_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chatkit_threads
      WHERE chatkit_threads.thread_id = chatkit_attachments.thread_id
        AND chatkit_threads.user_id = auth.uid()
    )
  );

CREATE POLICY "Users insert chatkit attachments in own threads"
  ON chatkit_attachments FOR INSERT
  WITH CHECK (
    auth.uid() = uploaded_by AND
    EXISTS (
      SELECT 1 FROM chatkit_threads
      WHERE chatkit_threads.thread_id = chatkit_attachments.thread_id
        AND chatkit_threads.user_id = auth.uid()
    )
  );

CREATE POLICY "Users update chatkit attachments in own threads"
  ON chatkit_attachments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM chatkit_threads
      WHERE chatkit_threads.thread_id = chatkit_attachments.thread_id
        AND chatkit_threads.user_id = auth.uid()
    )
  );

CREATE POLICY "Users delete chatkit attachments in own threads"
  ON chatkit_attachments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM chatkit_threads
      WHERE chatkit_threads.thread_id = chatkit_attachments.thread_id
        AND chatkit_threads.user_id = auth.uid()
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to generate ChatKit thread ID
CREATE OR REPLACE FUNCTION generate_chatkit_thread_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'thread_' || encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to generate ChatKit item ID
CREATE OR REPLACE FUNCTION generate_chatkit_item_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'msg_' || encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to generate ChatKit attachment ID
CREATE OR REPLACE FUNCTION generate_chatkit_attachment_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'att_' || encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to get next sequence number for thread item
CREATE OR REPLACE FUNCTION get_next_sequence_number(p_thread_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  next_seq INTEGER;
BEGIN
  SELECT COALESCE(MAX(sequence_number), 0) + 1
  INTO next_seq
  FROM chatkit_thread_items
  WHERE thread_id = p_thread_id;

  RETURN next_seq;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

-- This migration creates the ChatKit schema following the OpenAI ChatKit protocol.
-- The old `chats` and `messages` tables remain for backwards compatibility.
-- They can be migrated or removed in a future migration after verifying
-- the new ChatKit implementation works correctly.

-- Key differences from old schema:
-- 1. ChatKit uses string IDs (thread_abc123) not UUIDs
-- 2. Thread items include messages, widgets, and tool calls (not just messages)
-- 3. Content stored as JSONB for flexibility
-- 4. Attachments are separate entities with upload tracking
-- 5. Agent configuration stored in thread metadata
-- 6. Sequence numbers ensure correct item ordering
