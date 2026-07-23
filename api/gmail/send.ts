import { sendEmailService } from '../../server/services/gmailService';

export default async function handler(req: any, res: any) {
  const { to, subject, body, sessionId = 'default' } = req.body || {};
  const result = await sendEmailService({ to, subject, body }, sessionId as string);
  return res.json(result);
}
