import minors from '../data/ucdMinors.json';

export const fetchMinors = async (): Promise<string[]> => minors;
