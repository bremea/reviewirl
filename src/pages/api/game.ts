import * as jose from 'jose';
import { NextApiRequest, NextApiResponse } from 'next';

import redis from '@/lib/redis';

export default async function join(req: NextApiRequest, res: NextApiResponse) {
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

  const markers: [[number, number]?] = [];
  const mStrings = await redis.lrange(`markers:${gameCode}`, 0, -1);
  for (const m of mStrings) {
    markers.push(JSON.parse(`[${m}]`));
  }
  const players = await redis.smembers(`players:${gameCode}`);
  const admin = await redis.get(`admin:${gameCode}`);
  const status = await redis.get(`status:${gameCode}`);

  res.status(200).json({
    err: false,
    game: {
      code: gameCode,
      name: name,
      markers: markers,
      players: players,
      admin: admin,
      status: status,
    },
  });
}
