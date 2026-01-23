export const fetchUniversityNames = async (): Promise<string[]> => {
  const url =
    'https://raw.githubusercontent.com/MLH/mlh-policies/main/schools.csv';

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch universities');

    const text = await res.text();

    return text
      .split('\n')
      .slice(1) // removes metadata header
      .map((line) => line.trim().replace(/^"(.*)"$/, '$1'))
      .filter(Boolean);
  } catch (err) {
    console.error(err);
    return [];
  }
};
