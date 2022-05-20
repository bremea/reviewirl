import * as jose from 'jose';
import { NextApiRequest, NextApiResponse } from 'next';

import redis from '@/lib/redis';

export default async function start(req: NextApiRequest, res: NextApiResponse) {
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
      err: true,
      msg: 'Invalid auth token.',
    });
  }

  const isAdmin = (await redis.get(`admin:${gameCode}`)) === name;
  if (!isAdmin)
    return res.status(403).send({
      err: true,
      msg: 'Missing permissions.',
    });

  const players = await redis.smembers(`players:${gameCode}`);
  const half = Math.ceil(players.length / 2);

  if (players.length < 2)
    return res.status(403).send({
      err: true,
      msg: 'You need at least 2 players to start.',
    });

  const blue = players.slice(0, half);
  const red = players.slice(-half).filter((p) => !blue.includes(p));

  await redis.sadd(`blue:${gameCode}`, blue);
  await redis.sadd(`red:${gameCode}`, red);

  await redis.set(`status:${gameCode}`, 'started');
  redis.publish(`channel:${gameCode}`, `status:start`);
  for (const p of players) {
    if (blue.includes(p)) {
      redis.publish(`channel:${gameCode}`, `blue:${p}`);
    } else {
      redis.publish(`channel:${gameCode}`, `red:${p}`);
    }
  }

  res.status(200).json({ err: false });
}
