import * as jose from 'jose';
import { NextApiRequest, NextApiResponse } from 'next';

import mongo from '@/lib/mongo';
import redis from '@/lib/redis';
import { setType } from '@/lib/types';

export default async function question(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!req.headers.authorization)
    return res
      .status(403)
      .json({ err: true, msg: 'Please create a game first.' });
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
      err: true,
      msg: 'Invalid auth token.',
    });
  }
  const status = await redis.get(`status:${gameCode}`);
  if (status === 'ended' || status === 'waiting')
    return res.status(403).send({ err: true, msg: 'Game not in play.' });

  const kId = await redis.get(`kId:${gameCode}`);
  const db = await mongo();
  const questions = await db.collection('sets').findOne<setType>({ kId: kId });
  if (!questions)
    return res.status(403).send({
      err: true,
      msg: 'Invalid game.',
    });
  const question =
    questions.questions[Math.floor(Math.random() * questions.questions.length)];
  const id = questions.questions.indexOf(question);
  question.answers.forEach((object) => {
    delete object.correct;
  });

  res.status(200).json({
    err: false,
    question: question,
    id: id,
  });
}
