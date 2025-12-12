'use server';

import { UpdateUser } from '@datalib/users/updateUser';
import { revalidatePath } from 'next/cache';

export async function updateUser(id: string, body: object) {
  const response = await UpdateUser(id, body);
  revalidatePath('/', 'layout');
  revalidatePath('/judges');
  revalidatePath('/admin');
  return response;
}
