import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
let cachedClient = null;
let cachedPromise = null;

export async function getClient() {
  if (cachedClient) {
    return cachedClient;
  }

  if (!cachedPromise) {
    const client = new MongoClient(uri);
    cachedPromise = client.connect();
  }

  cachedClient = await cachedPromise;
  return cachedClient;
}

export async function getDatabase() {
  const client = await getClient();
  return client.db();
}
