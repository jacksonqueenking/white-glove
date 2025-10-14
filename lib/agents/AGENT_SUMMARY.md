# AI Agent System Summary

## Agent Types and Their Roles

### 1. Client Agent
**Purpose:** Help clients plan their event  
**Context:** Single event + all available offerings  
**Tools:** 10 tools (add elements, manage guests, complete tasks, message venue)  
**Personality:** Warm, enthusiastic, proactive  

### 2. Venue General Agent
**Purpose:** Venue-wide operations and navigation  
**Context:** ALL events + vendors + offerings  
**Tools:** 10 tools (list events, manage vendors, create offerings, send messages)  
**Personality:** Professional, efficient  
**Scope:** NO event-specific tools (no element/guest management)

### 3. Venue Event Agent  
**Purpose:** Manage a specific event in detail  
**Context:** Single event with complete details  
**Tools:** 14 tools (full event management, elements, guests, tasks, messages)  
**Personality:** Professional, detail-oriented  
**Scope:** Event-specific only

### 4. Vendor Context (No AI Agent)
**Purpose:** Generate suggestions for vendor interface  
**Context:** Vendor events, tasks, messages  
**Tools:** 4 tools (tasks, messages)  
**Interface:** Traditional UI with AI suggestions

## Key Design Decisions

1. **Two Venue Agents:** Separates venue-wide operations from event-specific work to manage context size and keep tools focused.

2. **Generous Context:** All agents receive comprehensive context including full task details, element descriptions, guest lists, and 20-30 recent actions.

3. **No Vendor AI:** Vendors get a simplified interface with AI-generated suggestions rather than a full AI assistant.

4. **OpenAI Standard:** All tools use standard OpenAI JSON schema format for compatibility.

5. **Permission-Aware:** Client tools cannot commit venue/vendors or delete committed elements.

## Files Created

- `lib/agents/prompts.ts` - System prompt generators (4 functions)
- `lib/agents/tools.ts` - Tool definitions (4 arrays + helper)
- `lib/agents/index.ts` - Main exports
- `lib/agents/README.md` - Documentation

## Next Steps for Implementation

1. Create context-building functions that fetch data from `lib/db/*`
2. Implement tool execution handlers (map tool calls to database functions)
3. Build conversation management (store chat history)
4. Add streaming support for real-time responses
5. Implement proper error handling and validation
6. Add audit logging for all AI actions
7. Test with real scenarios
