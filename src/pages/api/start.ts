import * as jose from 'jose';
import { NextApiRequest, NextApiResponse } from 'next';

import redis from '@/lib/redis';

export default async function join(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST')
    return res.status(403).json({ err: true, msg: 'POST reqs only' });
  if (!req.headers.authorization)
    return res
      .status(403)
      .json({ err: true, msg: 'Please create a game first.' });
  let gameCode = 0;
  let name = '';
  try {
    const { payload } = await jose.jwtVerify(
      req.headers.authorization,
      await jose.importPKCS8(process.env.JWTKEY as string, 'RSA'),
      { issuer: 'urn:rirl:issuer', audience: 'urn:rirl:audience' }
    );
    if (!payload) return;
    gameCode = payload.game as number;
    name = payload.sub as string;
  } catch (err) {
    return res.status(403).send({
      error: true,
      message: 'Invalid auth token.',
    });
  }

  const isAdmin = (await redis.get(`admin:${gameCode}`)) === name;
  if (!isAdmin)
    return res.status(403).send({
      error: true,
      message: 'Missing permissions.',
    });

  await redis.set(`status:${gameCode}`, 'started');
  redis.publish(`channel:${gameCode}`, `status:start`);

  res.status(200).json({ err: false });
}
