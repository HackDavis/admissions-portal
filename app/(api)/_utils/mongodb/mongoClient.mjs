import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('Missing MONGODB_URI environment variable.');
}

let cachedClient = null;
let cachedPromise = null;

export async function getClient() {
  if (cachedClient) {
    return cachedClient;
  }

  if (!cachedPromise) {
    const client = new MongoClient(uri);
    cachedPromise = client
      .connect()
      .then((connectedClient) => {
        cachedClient = connectedClient;
        return connectedClient;
      })
      .catch((error) => {
        cachedPromise = null;
        cachedClient = null;
        throw error;
      });
  }

  return cachedClient;
}

export async function getDatabase() {
  const client = await getClient();
  return client.db();
}
