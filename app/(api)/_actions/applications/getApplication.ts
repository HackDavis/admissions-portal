'use server';
import {
  GetApplication,
  GetManyApplications,
} from '@datalib/applications/getApplication';

// These functions should not be called directly in code, please use the proper wrapper functions: getAdminApplications.ts, checkEmail.ts
export async function getApplication(id: string) {
  const res = await GetApplication(id);
  return JSON.parse(JSON.stringify(res));
}

export async function getManyApplications(query: object = {}) {
  const res = await GetManyApplications(query);
  return JSON.parse(JSON.stringify(res));
}
