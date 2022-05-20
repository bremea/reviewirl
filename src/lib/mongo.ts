import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGO_URL as string);

const mongo = async () => {
  await client.connect();
  const db = client.db('rirl');
  return db;
};

export default mongo;
