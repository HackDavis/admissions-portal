import { fetchMajors } from './fetchMajors';

export const fetchMinors = async (): Promise<string[]> => {
  const majors = await fetchMajors();
  return [...majors, 'Other'];
};
