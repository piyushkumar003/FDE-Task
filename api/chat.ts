import { processUserMessage } from '../server/ai/agent';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { content, sessionId = 'default' } = req.body || {};
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Message content string is required' });
    }

    const result = await processUserMessage(content, sessionId);
    return res.json(result);
  } catch (error: any) {
    console.error('Error processing chat message:', error);
    return res.status(500).json({
      error: error?.message || 'An error occurred while processing your request',
    });
  }
}
