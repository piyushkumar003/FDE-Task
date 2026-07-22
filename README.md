# Nexus AI Workspace Console (Vercel Serverless Edition)

Nexus AI Workspace Console is an executive AI Personal Assistant built with React 18, Vite, Google Gemini 2.5 Pro, and Vercel Serverless Functions. It provides voice-driven and text-based Google Workspace orchestration (Google Calendar, Tasks, Gmail, Contacts, and Drive).

## Architecture

- **Frontend**: React 18 SPA built with Vite, Tailwind CSS, Lucide icons, and Motion animations.
- **Backend**: Native Vercel Serverless Functions (`/api/*`) handling Gemini inference, Google Workspace integrations, and OAuth authentication.
- **Persistence**: Serverless-ready session memory and undo stack management.

## Project Structure

```
├── api/
│   ├── health.ts
│   ├── diagnostic.ts
│   ├── chat.ts
│   ├── agenda.ts
│   ├── memory.ts
│   ├── action/undo.ts
│   ├── auth/
│   │   ├── status.ts
│   │   ├── url.ts
│   │   ├── callback.ts
│   │   └── logout.ts
│   ├── calendar/
│   │   ├── list.ts
│   │   ├── create.ts
│   │   ├── update.ts
│   │   └── delete.ts
│   └── tasks/
│       ├── list.ts
│       ├── create.ts
│       ├── update.ts
│       └── delete.ts
├── server/
│   ├── ai/
│   │   ├── agent.ts
│   │   └── prompts.ts
│   ├── auth.ts
│   ├── memory.ts
│   └── tools/
│       ├── calendarTool.ts
│       ├── contactsTool.ts
│       ├── driveTool.ts
│       ├── gmailTool.ts
│       └── taskTool.ts
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   ├── services/
│   └── types.ts
├── vercel.json
├── package.json
└── .env.example
```

## Environment Variables

Configure the following environment variables in Vercel project settings or `.env`:

- `GEMINI_API_KEY`: Google Gemini API Key.
- `GOOGLE_CLIENT_ID`: Google OAuth 2.0 Client ID.
- `GOOGLE_CLIENT_SECRET`: Google OAuth 2.0 Client Secret.
- `APP_URL`: Production application URL.

## Deployment on Vercel

1. Push your code to GitHub.
2. Import the repository into Vercel.
3. Configure Environment Variables in Vercel Project Settings.
4. Deploy! Vercel will automatically compile the frontend and deploy the serverless functions in `api/`.
