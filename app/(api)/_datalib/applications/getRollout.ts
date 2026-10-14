import { getDatabase } from '@utils/mongodb/mongoClient.mjs';
import { HttpError, NotFoundError } from '@utils/response/Errors';

export const GetRollout = async (component_key: string) => {
  try {
    const db = await getDatabase();

    const date = await db.collection('rollouts').findOne({
      component_key: component_key,
    });

    if (date === null) {
      throw new NotFoundError(
        `Rollout with component_key: ${component_key} not found.`
      );
    }

    return { ok: true, body: date.rollout_time, error: null };
  } catch (e) {
    const error = e as HttpError;
    return { ok: false, body: null, error: error.message };
  }
};

export const GetRollback = async (component_key: string) => {
  try {
    const db = await getDatabase();

    const date = await db.collection('rollouts').findOne({
      component_key: component_key,
    });

    if (date === null) {
      throw new NotFoundError(
        `Rollout with component_key: ${component_key} not found.`
      );
    }

    return { ok: true, body: date.rollback_time, error: null };
  } catch (e) {
    const error = e as HttpError;
    return { ok: false, body: null, error: error.message };
  }
};
