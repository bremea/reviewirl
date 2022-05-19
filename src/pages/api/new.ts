import * as jose from 'jose';
import { NextApiRequest, NextApiResponse } from 'next';

import redis from '@/lib/redis';

export default async function join(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST')
    return res.status(403).json({ err: true, msg: 'POST reqs only' });
  if (!req.body.link)
    return res
      .status(403)
      .json({ err: true, msg: 'Please enter a kahoot link' });
  if (!req.body.name)
    return res.status(403).json({ err: true, msg: 'Please enter your name' });
  if (!req.body.link.startsWith('https://create.kahoot.it/details/'))
    return res.status(403).json({ err: true, msg: 'Invalid kahoot link' });

  let gameCodeAlreadyExists;
  let gameCode;
  do {
    gameCode = Math.floor(100000 + Math.random() * 900000);
    gameCodeAlreadyExists = await redis.get(gameCode.toString());
  } while (gameCodeAlreadyExists);

  await redis.set(
    `kId:${gameCode}`,
    req.body.link.replace('https://create.kahoot.it/details/', '')
  );
  await redis.set(gameCode.toString(), new Date().toUTCString());
  await redis.sadd(`players:${gameCode}`, req.body.name);
  await redis.set(`admin:${gameCode}`, req.body.name);
  await redis.set(`status:${gameCode}`, 'waiting');

  const jwt = await new jose.SignJWT({ game: gameCode })
    .setIssuedAt()
    .setSubject(req.body.name as string)
    .setIssuer('urn:rirl:issuer')
    .setAudience('urn:rirl:audience')
    .setProtectedHeader({ alg: 'RS256' })
    .sign(await jose.importPKCS8(process.env.JWTKEY as string, 'RSA'));

  res.status(200).json({ err: false, jwt: jwt });
}
