import { getClient, resetClient } from '@utils/mongodb/mongoClient.mjs';
import { MongoClient } from 'mongodb';

describe('getClient', () => {
  beforeEach(() => {
    resetClient();
    jest.clearAllMocks();
  });

  it('should return the same instance on multiple calls', async () => {
    const mockConnect = jest.fn().mockResolvedValue({});
    MongoClient.prototype.connect = mockConnect;

    const c1 = await getClient();
    const c2 = await getClient();

    expect(c1).toBe(c2);
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  it('should retry after a failed connection', async () => {
    MongoClient.prototype.connect = jest
      .fn()
      .mockRejectedValueOnce(new Error('Network Fail'))
      .mockResolvedValueOnce({});

    await expect(getClient()).rejects.toThrow('Network Fail');

    await expect(getClient()).resolves.toBeDefined();
  });
});
