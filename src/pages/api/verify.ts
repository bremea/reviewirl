import * as jose from 'jose';
import { NextApiRequest, NextApiResponse } from 'next';

import mongo from '@/lib/mongo';
import redis from '@/lib/redis';
import { setType } from '@/lib/types';

export default async function setup(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST')
    return res.status(403).json({ err: true, msg: 'POST reqs only' });
  if (!req.headers.authorization)
    return res
      .status(403)
      .json({ err: true, msg: 'Please create a game first.' });
  if (
    !req.body.answer ||
    !req.body.question ||
    req.body.markerId === -1 ||
    req.body.qId === undefined
  )
    return res
      .status(403)
      .json({ err: true, msg: 'Please answer the question.' });
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
  const status = await redis.get(`status:${gameCode}`);
  if (status === 'ended' || status === 'waiting')
    return res.status(403).send({ err: true, msg: 'Game not in play.' });

  const kId = await redis.get(`kId:${gameCode}`);
  const db = await mongo();
  const set = await db.collection('sets').findOne<setType>({ kId: kId });
  const question = set?.questions[req.body.qId];
  if (!question)
    return res.status(403).send({
      err: true,
      msg: 'Invalid question.',
    });

  const answer = question.answers.filter((a) => a.label === req.body.answer)[0];
  if (!answer)
    return res.status(403).send({
      err: true,
      msg: 'Invalid answer.',
    });
  if (!answer.correct)
    return res.status(200).send({
      err: false,
      cor: false,
      msg: 'Incorrect!',
    });

  const team = (await redis.sismember(`blue:${gameCode}`, name))
    ? 'blue'
    : 'red';
  await redis.lset(`markerTeams:${gameCode}`, req.body.markerId, team);

  redis.publish(`channel:${gameCode}`, `m${team}:${req.body.markerId}`);

  res.status(200).json({ err: false, cor: true, msg: 'Correct!' });
}
