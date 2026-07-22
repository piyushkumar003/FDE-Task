import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { processUserMessage } from './ai/agent';
import { generateAuthUrl, getAuthStatus, handleAuthCallback, logoutUser } from './auth';
import { getSession, popUndoItem } from './memory';
import { list_events, create_event, update_event, delete_event, restoreDeletedEvent } from './tools/calendarTool';
import { listTasks, restoreDeletedTask, deleteTask } from './tools/taskTool';

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Diagnostic Endpoint (Step 13)
  app.get('/api/diagnostic', async (req, res) => {
    const diagnostic: any = {
      timestamp: new Date().toISOString(),
      env: {
        nodeEnv: process.env.NODE_ENV || 'development',
        hasGeminiApiKey: !!process.env.GEMINI_API_KEY,
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        appUrl: process.env.APP_URL || 'Not set',
      },
      gemini: 'UNKNOWN',
      calendar: 'UNKNOWN',
      tasks: 'UNKNOWN',
      oauth: getAuthStatus(),
    };

    // Test Gemini
    try {
      if (process.env.GEMINI_API_KEY) {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const testRes = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: 'Say OK',
        });
        diagnostic.gemini = testRes.text ? 'OK (Connected)' : 'OK (No text response)';
      } else {
        diagnostic.gemini = 'DISABLED (Missing GEMINI_API_KEY)';
      }
    } catch (err: any) {
      diagnostic.gemini = `ERROR: ${err?.message || err}`;
    }

    // Test Calendar
    try {
      const calRes = await list_events();
      diagnostic.calendar = calRes.success ? 'OK (Connected)' : `ERROR: ${calRes.reason}`;
    } catch (err: any) {
      diagnostic.calendar = `ERROR: ${err?.message || err}`;
    }

    // Test Tasks
    try {
      const taskRes = await listTasks('all');
      diagnostic.tasks = taskRes.success ? 'OK (Connected)' : `ERROR: ${taskRes.reason}`;
    } catch (err: any) {
      diagnostic.tasks = `ERROR: ${err?.message || err}`;
    }

    res.json(diagnostic);
  });

  // Auth Routes
  app.get('/api/auth/status', (req, res) => {
    res.json(getAuthStatus());
  });

  app.get('/api/auth/url', (req, res) => {
    res.json({ authUrl: generateAuthUrl() });
  });

  app.post('/api/auth/callback', async (req, res) => {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }
    const authState = await handleAuthCallback(code);
    res.json(authState);
  });

  app.post('/api/auth/logout', (req, res) => {
    logoutUser();
    res.json({ success: true });
  });

  // Chat Agent Route
  app.post('/api/chat', async (req, res) => {
    try {
      const { content, sessionId = 'default' } = req.body;
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: 'Message content string is required' });
      }

      const result = await processUserMessage(content, sessionId);
      res.json(result);
    } catch (error: any) {
      console.error('Error processing chat message:', error);
      res.status(500).json({
        error: error?.message || 'An error occurred while processing your request',
      });
    }
  });

  // Google Calendar Tool Direct API Routes
  app.get('/api/tools/calendar/events', async (req, res) => {
    const { startDate, endDate } = req.query;
    const result = await list_events(startDate as string, endDate as string);
    res.json(result);
  });

  app.post('/api/tools/calendar/events', async (req, res) => {
    const result = await create_event(req.body);
    res.json(result);
  });

  app.patch('/api/tools/calendar/events', async (req, res) => {
    const result = await update_event(req.body);
    res.json(result);
  });

  app.delete('/api/tools/calendar/events', async (req, res) => {
    const eventId = (req.body?.eventId || req.body?.id || req.query.eventId || req.query.id) as string;
    const result = await delete_event(eventId);
    res.json(result);
  });

  // Agenda feed route (Calendar events + Google Tasks)
  app.get('/api/agenda', async (req, res) => {
    try {
      const eventsRes = await list_events();
      const tasksRes = await listTasks('needsAction');

      res.json({
        events: eventsRes.success ? eventsRes.data : [],
        tasks: tasksRes.success ? tasksRes.data : [],
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch agenda feed' });
    }
  });

  // Memory inspect route
  app.get('/api/memory', (req, res) => {
    const sessionId = (req.query.sessionId as string) || 'default';
    const session = getSession(sessionId);
    res.json(session.memory);
  });

  // Undo operation route
  app.post('/api/action/undo', async (req, res) => {
    const { actionId, sessionId = 'default' } = req.body;
    const undoItem = popUndoItem(sessionId, actionId);

    if (!undoItem) {
      return res.status(404).json({ success: false, message: 'No action found to undo.' });
    }

    try {
      if (undoItem.actionType === 'calendar.create') {
        await delete_event(undoItem.itemData.id);
        return res.json({ success: true, message: `Reverted creation of event "${undoItem.itemData.summary}".` });
      } else if (undoItem.actionType === 'calendar.delete') {
        restoreDeletedEvent(undoItem.itemData);
        return res.json({ success: true, message: `Restored deleted event "${undoItem.itemData.summary}".` });
      } else if (undoItem.actionType === 'tasks.create') {
        await deleteTask(undoItem.itemData.id);
        return res.json({ success: true, message: `Reverted creation of task "${undoItem.itemData.title}".` });
      } else if (undoItem.actionType === 'tasks.delete') {
        restoreDeletedTask(undoItem.itemData);
        return res.json({ success: true, message: `Restored deleted task "${undoItem.itemData.title}".` });
      }
      res.json({ success: true, message: 'Undo action processed.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || 'Failed to undo action' });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}
