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
  if (!req.body.markers || req.body.markers.length === 0)
    return res
      .status(403)
      .json({ err: true, msg: 'Please place at least one marker.' });
  let gameCode = 0;
  try {
    const { payload } = await jose.jwtVerify(
      req.headers.authorization,
      await jose.importPKCS8(process.env.JWTKEY as string, 'RSA'),
      { issuer: 'urn:rirl:issuer', audience: 'urn:rirl:audience' }
    );
    if (!payload) return;
    gameCode = payload.game as number;
  } catch (err) {
    return res.status(403).send({
      error: true,
      message: 'Invalid auth token.',
    });
  }

  const markers = req.body.markers as [[number, number]];
  const markersString: string[] = [];
  for (const m of markers) {
    markersString.push(m.toString());
  }

  redis.lpush(`markers:${gameCode}`, ...markersString);

  res.status(200).json({ err: false });
}
