import { getContactsService } from '../../server/services/contactsService';

export default async function handler(req: any, res: any) {
  const query = req.query?.q || req.query?.query || '';
  const sessionId = req.query?.sessionId || req.body?.sessionId || 'default';
  const result = await getContactsService(query as string, sessionId as string);
  return res.json(result);
}
