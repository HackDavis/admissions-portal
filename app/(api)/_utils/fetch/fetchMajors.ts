import majors from '../data/ucdMajors.json';

export const fetchMajors = async (): Promise<string[]> => majors;
