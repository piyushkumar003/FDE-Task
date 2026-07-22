export default async function handler(req: any, res: any) {
  return res.json({ status: 'ok', timestamp: new Date().toISOString() });
}
