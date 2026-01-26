'use server';
import {
  GetApplication,
  GetManyApplications,
} from '@datalib/applications/getApplication';

export async function getApplication(id: string) {
  const res = await GetApplication(id);
  return JSON.parse(JSON.stringify(res));
}

export async function getManyApplications(query: object = {}) {
  const res = await GetManyApplications(query);
  return JSON.parse(JSON.stringify(res));
}
