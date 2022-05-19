import * as jose from 'jose';
import { NextApiRequest, NextApiResponse } from 'next';

import redis from '@/lib/redis';

export default async function join(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST')
    return res.status(403).json({ err: true, msg: 'POST reqs only' });
  if (!req.body.game)
    return res.status(403).json({ err: true, msg: 'Please enter a game code' });
  if (!req.body.name)
    return res.status(403).json({ err: true, msg: 'Please enter your name' });

  const game = await redis.get(req.body.game);
  if (!game) return res.status(403).json({ err: true, msg: 'Game not found' });

  const usernameTaken = await redis.sismember(
    `players:${req.body.game}`,
    req.body.name
  );
  if (usernameTaken)
    return res.status(403).json({ err: true, msg: 'Name already taken' });

  await redis.sadd(`players:${req.body.game}`, req.body.name);

  const jwt = await new jose.SignJWT({ game: req.body.game })
    .setIssuedAt()
    .setSubject(req.body.name as string)
    .setIssuer('urn:rirl:issuer')
    .setAudience('urn:rirl:audience')
    .setProtectedHeader({ alg: 'RS256' })
    .sign(await jose.importPKCS8(process.env.JWTKEY as string, 'RSA'));

  res.status(200).json({ err: false, jwt: jwt });
}
