'use server';

import { CreateUser } from '@datalib/users/createUser';
import { revalidatePath } from 'next/cache';

export async function createUser(body: object) {
  const response = await CreateUser(body);
  revalidatePath('/', 'layout');
  return response;
}
