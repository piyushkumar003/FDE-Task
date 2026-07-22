import { GoogleGenAI } from '@google/genai';
import { getAuthStatus } from '../server/auth';
import { list_events } from '../server/tools/calendarTool';
import { listTasks } from '../server/tools/taskTool';

export default async function handler(req: any, res: any) {
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

  try {
    if (process.env.GEMINI_API_KEY) {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const testRes = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Say OK',
      });
      diagnostic.gemini = testRes.text ? 'OK (Connected)' : 'OK (No text response)';
    } else {
      diagnostic.gemini = 'DISABLED (Missing GEMINI_API_KEY)';
    }
  } catch (err: any) {
    diagnostic.gemini = `ERROR: ${err?.message || err}`;
  }

  try {
    const calRes = await list_events();
    diagnostic.calendar = calRes.success ? 'OK (Connected)' : `ERROR: ${calRes.reason}`;
  } catch (err: any) {
    diagnostic.calendar = `ERROR: ${err?.message || err}`;
  }

  try {
    const taskRes = await listTasks('all');
    diagnostic.tasks = taskRes.success ? 'OK (Connected)' : `ERROR: ${taskRes.reason}`;
  } catch (err: any) {
    diagnostic.tasks = `ERROR: ${err?.message || err}`;
  }

  return res.json(diagnostic);
}
