import * as jose from 'jose';
import { NextApiRequest, NextApiResponse } from 'next';
import petitio from 'petitio';

import mongo from '@/lib/mongo';
import redis from '@/lib/redis';
import { quType } from '@/lib/types';

export default async function newGame(
  req: NextApiRequest,
  res: NextApiResponse
) {
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

  const kId = req.body.link.replace('https://create.kahoot.it/details/', '');

  await redis.set(`kId:${gameCode}`, kId);
  await redis.set(gameCode.toString(), new Date().toUTCString());
  await redis.sadd(`players:${gameCode}`, req.body.name);
  await redis.set(`admin:${gameCode}`, req.body.name);
  await redis.set(`status:${gameCode}`, 'waiting');

  const db = await mongo();
  const setExists = await db.collection('sets').findOne({ kId: kId });
  if (!setExists) {
    const request = petitio(
      `https://create.kahoot.it/rest/kahoots/${kId}/card/?includeKahoot=true`
    );
    const result = await (await request.send()).json();

    const questions = result.kahoot.questions;
    const qsToSend: Array<quType> = [];
    for (const question of questions) {
      const obj: quType = { question: '', answers: [] };
      obj.question = question.question;
      const choices = question.choices;
      for (const choice of choices) {
        obj.answers.push({ label: choice.answer, correct: choice.correct });
      }
      if (question.image !== '') obj.image = question.image;
      qsToSend.push(obj);
    }

    db.collection('sets').insertOne({ kId: kId, questions: qsToSend });
  }

  const jwt = await new jose.SignJWT({ game: gameCode })
    .setIssuedAt()
    .setSubject(req.body.name as string)
    .setIssuer('urn:rirl:issuer')
    .setAudience('urn:rirl:audience')
    .setProtectedHeader({ alg: 'RS256' })
    .sign(await jose.importPKCS8(process.env.JWTKEY as string, 'RSA'));

  res.status(200).json({ err: false, jwt: jwt });
}
