import { createTask } from '../../server/tools/taskTool';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const result = await createTask(req.body);
  return res.json(result);
}
