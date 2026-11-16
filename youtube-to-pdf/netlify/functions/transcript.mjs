import { handleRequest } from '../../lib/youtube.mjs';

export default async (req) => {
  const { status, body } = await handleRequest(req.url);
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
};

export const config = { path: '/api/transcript', method: 'GET' };
