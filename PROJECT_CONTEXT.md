# PROJECT_CONTEXT.md

## Overview
Nexus AI Console is an executive AI Personal Assistant built with React 18, Vite, Express, and Google Gemini 2.5 Pro. It provides voice-driven and text-based Google Workspace orchestration (Google Calendar, Tasks, Gmail, Contacts, and Drive).

---

## Current Architecture
- **Frontend**: Single-Page Application (SPA) using React 18, Tailwind CSS, Lucide Icons, Web Speech API (speech recognition and speech synthesis), and custom custom-scrollbar dark console UI.
- **Backend**: Express v4 Node.js server (`server.ts`) running on port 3000 behind Nginx, featuring TypeScript execution via `tsx` in dev and bundled CommonJS (`dist/server.cjs`) via `esbuild` for production.
- **AI Agent Engine**: Powered by Google Gemini 2.5 Pro via `@google/genai` SDK (`server/ai/agent.ts`). Handles natural language intent classification, multi-turn entity extraction, slot filling, and workspace tool execution.
- **State & Memory Engine**: In-memory session store (`server/memory.ts`) tracking slot parameters, pending clarification states, last referenced events/tasks, resolved Google Contacts, and undo history stack.

---

## Folder Structure
```
├── .env.example                # Environment variable declarations
├── firebase-applet-config.json # Firebase configuration
├── metadata.json               # Platform metadata & permissions
├── package.json                # Dependencies & script configurations
├── server.ts                   # Express server entry point & API routes
├── server/
│   ├── ai/
│   │   ├── agent.ts            # Gemini AI agent orchestrator & tool executor
│   │   └── prompts.ts          # Agent prompt templates & system instructions
│   ├── auth.ts                 # Google OAuth2 client & authentication handlers
│   ├── memory.ts               # Multi-turn session memory & undo stack
│   └── tools/
│       ├── calendarTool.ts     # Google Calendar tool (create, update, delete, list, overlap detection)
│       ├── contactsTool.ts     # Google Contacts tool
│       ├── driveTool.ts        # Google Drive tool
│       ├── gmailTool.ts        # Google Gmail tool
│       └── taskTool.ts         # Google Tasks tool
└── src/
    ├── App.tsx                 # Main application layout & global state
    ├── index.css               # Global CSS & Tailwind imports
    ├── main.tsx                # Client mounting entry point
    ├── types.ts                # Shared TypeScript types & interfaces
    ├── components/
    │   ├── AgendaSidebar.tsx   # Workspace active context drawer (Calendar & Tasks feed)
    │   ├── ChatInterface.tsx   # Messages feed, quick prompts carousel, voice & text bar
    │   ├── Header.tsx          # App header, latency indicator, voice toggle, memory/agenda triggers
    │   ├── MemoryInspector.tsx # Agent memory & slot state modal
    │   └── VoiceController.tsx # Web Speech API voice microphone trigger & feedback
    └── services/
        └── api.ts              # Client API wrapper for server endpoints
```

---

## Key Design Decisions
1. **Overlap Handling in Calendar**:
   - `checkEventOverlap` detects overlapping time slots for new/updated events.
   - Returns `already added` if the task summary is identical or matching.
   - Returns `overlapping with <Event Title>` if the task summary is different.
2. **Multi-Turn Slot Clarification**:
   - When required fields (e.g. event start time, missing attendee email) are missing, Nexus AI enters a pending slot state without throwing errors, prompting the user for clarification in a conversational manner.
3. **Voice Audio Synthesis & Recognition**:
   - Integrated client-side Web Speech API for hands-free voice input and optional text-to-speech audio responses.
4. **Undo Capability**:
   - Maintains an undo history stack for calendar creations, updates, and deletions, allowing one-click rollbacks via `/api/agent/undo`.

---

## Installed Packages
- `@google/genai` (^0.1.1): Official Google Gen AI SDK for Gemini models.
- `express` (^4.19.2): Node.js HTTP server.
- `googleapis` (^137.0.0): Google APIs client library (Calendar, Tasks, Gmail, Drive, People API).
- `lucide-react` (^0.344.0): UI Icon set.
- `react` & `react-dom` (^18.2.0): UI framework.
- `esbuild` & `tsx`: Build and dev runner for TypeScript.

---

## API Endpoints
- **POST `/api/agent/message`**: Core conversation orchestrator endpoint. Accepts `{ message: string }`, returns AI response, tool executions, slot status, and synthesized speech audio.
- **POST `/api/agent/undo`**: Reverts the last write operation (e.g., event creation/deletion).
- **GET `/api/agent/memory`**: Fetches current agent memory state and resolved session entities.
- **GET `/api/agenda`**: Fetches active workspace feed (upcoming calendar events + pending Google tasks).
- **GET `/api/tools/calendar/events`**: Lists calendar events with `startDate` and `endDate` parameters.
- **POST `/api/tools/calendar/events`**: Creates a calendar event with overlap detection.
- **PATCH `/api/tools/calendar/events`**: Updates an existing calendar event with overlap detection.
- **DELETE `/api/tools/calendar/events`**: Deletes a calendar event.
- **GET `/api/auth/status`**: Checks Google Workspace connection status.
- **GET `/api/auth/url`**: Generates OAuth authorization URL.
- **GET `/api/auth/callback`**: OAuth redirect callback handler.
- **POST `/api/auth/logout`**: Clears Google authentication tokens.

---

## Tool Interfaces
- `list_events(startDate?: string, endDate?: string)` -> `Promise<ToolResult>`
- `create_event(params: CreateEventInput)` -> `Promise<ToolResult>`
- `update_event(params: UpdateEventInput)` -> `Promise<ToolResult>`
- `delete_event(input: DeleteEventInput | string)` -> `Promise<ToolResult>`
- `listTasks(status?: string)` -> `Promise<ToolResult>`
- `createTask(title: string, due?: string)` -> `Promise<ToolResult>`
- `deleteTask(taskId: string)` -> `Promise<ToolResult>`

---

## Environment Variables
- `GEMINI_API_KEY`: Secret API key for Google Gemini model access.
- `APP_URL`: Target URL for the Cloud Run deployment instance.

---

## Pending TODOs
- All core milestones and features completed (100%).
