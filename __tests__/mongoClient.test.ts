/** @jest-environment node */
import { getClient, resetClient } from '@utils/mongodb/mongoClient.mjs';
import { MongoClient } from 'mongodb';

describe('getClient', () => {
  beforeEach(() => {
    resetClient();
    jest.restoreAllMocks();
  });

  beforeAll(() => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
  });

  afterAll(() => {
    delete process.env.MONGODB_URI;
  });

  it('should return the same instance on multiple calls', async () => {
    const mockDb = { db: jest.fn() };
    const spy = jest
      .spyOn(MongoClient.prototype, 'connect')
      .mockResolvedValue(mockDb as any);

    const c1 = await getClient();
    const c2 = await getClient();

    expect(c1).toBe(c2);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should retry after a failed connection', async () => {
    const spy = jest
      .spyOn(MongoClient.prototype, 'connect')
      .mockRejectedValueOnce(new Error('Network Fail'))
      .mockResolvedValueOnce({ db: jest.fn() } as any);

    await expect(getClient()).rejects.toThrow('Network Fail');

    resetClient();

    await expect(getClient()).resolves.toBeDefined();
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
