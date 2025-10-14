# Chat Components

This directory contains the ChatKit integration for AI-powered chat interfaces.

## Components

### ChatKit Integration
- **ChatKitWrapper.tsx** - Base wrapper for OpenAI ChatKit
- **ClientEventChat.tsx** - Client-facing event planning chat
- **VenueEventChat.tsx** - Venue event management chat
- **VenueGeneralChat.tsx** - Venue-wide operations chat

### Supporting Components
- **ChatHistoryList.tsx** - Conversation history sidebar (still in use)

## Migration Notes

The following old components have been removed and replaced with ChatKit:
- ❌ ChatWindow.tsx (removed - replaced by ClientEventChat)
- ❌ BaseChatWindow.tsx (removed - replaced by ChatKitWrapper)
- ❌ VenueChatWindow.tsx (removed - replaced by VenueEventChat)

## Documentation

See the following for implementation details:
- [CHATKIT_IMPLEMENTATION.md](../../CHATKIT_IMPLEMENTATION.md)
- [docs/chatkit-setup.md](../../docs/chatkit-setup.md)
- [QUICK_START_CHATKIT.md](../../QUICK_START_CHATKIT.md)
