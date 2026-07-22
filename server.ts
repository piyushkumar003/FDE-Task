import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { processUserMessage } from './server/ai/agent';
import { generateAuthUrl, getAuthStatus, handleAuthCallback, logoutUser } from './server/auth';
import { getSession, popUndoItem } from './server/memory';
import { list_events, create_event, update_event, delete_event, restoreDeletedEvent } from './server/tools/calendarTool';
import { listTasks, restoreDeletedTask, deleteTask } from './server/tools/taskTool';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
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

  // Vite Middleware for dev / static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nexus AI Assistant Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
