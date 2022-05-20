import * as jose from 'jose';
import { NextApiRequest, NextApiResponse } from 'next';

import redis from '@/lib/redis';
import { Markers, TeamValues } from '@/lib/types';

export default async function game(req: NextApiRequest, res: NextApiResponse) {
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

  const markers: Markers = [];
  const mStrings = await redis.lrange(`markers:${gameCode}`, 0, -1);
  const mTeams = (await redis.lrange(
    `markerTeams:${gameCode}`,
    0,
    -1
  )) as Array<TeamValues>;
  for (let o = 0; o < mStrings.length; o++) {
    markers.push({ location: JSON.parse(`[${mStrings[o]}]`), team: mTeams[o] });
  }
  const players = await redis.smembers(`players:${gameCode}`);
  const admin = await redis.get(`admin:${gameCode}`);
  const status = await redis.get(`status:${gameCode}`);
  const team = (await redis.sismember(`blue:${gameCode}`, name))
    ? 'blue'
    : 'red';
  const time = new Date((await redis.get(gameCode.toString())) as string);

  res.status(200).json({
    err: false,
    game: {
      code: gameCode,
      name: name,
      markers: markers,
      players: players,
      endsAt: new Date(time.getTime() + 1 * 60 * 1000).toUTCString(),
      admin: admin,
      team: team,
      status: status,
    },
  });
}
