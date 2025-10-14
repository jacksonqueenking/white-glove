# ChatKit Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Set Environment Variable

```bash
export OPENAI_API_KEY=sk-proj-your-key-here
```

Or add to `.env.local`:
```
OPENAI_API_KEY=sk-proj-your-key-here
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Test the Chat

Navigate to an event page:
- **Client**: `http://localhost:3000/client/event/[event-id]`
- **Venue**: `http://localhost:3000/venue/events/[event-id]`

Chat interface will appear in the left sidebar.

## 📝 Try These Example Messages

### For Clients
```
"What elements do I have selected for my event?"
"Add a guest named Sarah Johnson with email sarah@example.com"
"What tasks do I need to complete?"
"Show me available catering options"
```

### For Venue Staff
```
"What's the status of this event?"
"Create a task for the client to confirm final guest count"
"List all pending tasks for this event"
"Show me guest statistics"
```

## 🔧 What Was Changed

### New Files
- `components/chat/ChatKitWrapper.tsx` - ChatKit integration
- `components/chat/ClientEventChat.tsx` - Client chat
- `components/chat/VenueEventChat.tsx` - Venue event chat
- `components/chat/VenueGeneralChat.tsx` - Venue general chat
- `lib/agents/agentSDK.ts` - Agents SDK integration
- `app/api/chatkit/session/route.ts` - Session management

### Modified Files
- `components/layout/AppShell.tsx` - Uses new chat components

### Dependencies Added
- `@openai/chatkit-react` - ChatKit UI
- `@openai/agents` - Agents SDK
- `zod@3` - Schema validation

## 🎯 Key Features

### ✅ Automatic Context
Agents know about:
- Current event details
- Selected elements & pricing
- Guest lists & RSVPs
- Tasks & deadlines
- Recent activity
- Available offerings

### ✅ Built-in Tools
Agents can:
- Add/remove elements
- Manage guests
- Create/complete tasks
- Send messages
- Update event status
- Search offerings

### ✅ Production Ready
- Streaming responses
- Error handling
- Permission checks
- Session management
- Responsive UI

## 📚 Documentation

- **[CHATKIT_IMPLEMENTATION.md](./CHATKIT_IMPLEMENTATION.md)** - Full implementation details
- **[docs/chatkit-setup.md](./docs/chatkit-setup.md)** - Detailed setup guide
- **[docs/ai-agents.md](./docs/ai-agents.md)** - Agent architecture

## 🐛 Troubleshooting

### Chat shows "Loading chat..."
- Check OPENAI_API_KEY is set
- Verify user is authenticated
- Check browser console for errors

### Tools not working
- Check server console for errors
- Verify database connection
- Check permissions

### Session creation fails
- Verify OPENAI_API_KEY is valid
- Check API rate limits
- Review server logs

## 🎨 Customization

### Change Theme
Edit `components/chat/ChatKitWrapper.tsx`:
```typescript
theme: {
  colors: {
    primary: '#your-color',
    // ... more colors
  },
}
```

### Change Start Screen
Edit `ChatKitWrapper.tsx`:
```typescript
startScreen: {
  title: 'Your Title',
  subtitle: 'Your subtitle',
}
```

### Add New Tools
1. Define in `lib/agents/tools.ts`
2. Implement handler in `lib/agents/toolHandlers.ts`
3. That's it! Auto-registered with agents.

## 🚀 Production Setup

### Create Agent Builder Workflows

1. Go to [platform.openai.com/agent-builder](https://platform.openai.com/agent-builder)
2. Create 3 workflows:
   - Client Assistant
   - Venue Event Manager
   - Venue General Manager
3. Configure each with your prompts and tools
4. Get workflow IDs
5. Add to `.env.local`:

```bash
OPENAI_WORKFLOW_ID_CLIENT=workflow_abc123
OPENAI_WORKFLOW_ID_VENUE_GENERAL=workflow_def456
OPENAI_WORKFLOW_ID_VENUE_EVENT=workflow_ghi789
```

## 💡 Tips

- **Context Updates**: Context refreshes on each new message
- **Tool Execution**: Check server console for tool logs
- **Session Duration**: Sessions expire after inactivity
- **Error Messages**: Shown inline in chat
- **Streaming**: Responses stream in real-time

## 📞 Need Help?

Check these files:
1. `CHATKIT_IMPLEMENTATION.md` - Overview & testing
2. `docs/chatkit-setup.md` - Detailed setup
3. `docs/ai-agents.md` - Agent system
4. Server console - Tool execution logs
5. Browser console - Client errors

## ✨ What's Next?

- [ ] Test all user flows
- [ ] Create Agent Builder workflows
- [ ] Add monitoring
- [ ] Customize theme
- [ ] Add more tools
- [ ] Store conversation history

Happy chatting! 🎉
