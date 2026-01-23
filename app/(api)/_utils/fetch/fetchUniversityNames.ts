//https://github.com/MLH/mlh-policies/blob/main/schools.csv

export const fetchUniversityNames = async (): Promise<string[]> => {
  const url =
    'https://raw.githubusercontent.com/Hipo/university-domains-list/refs/heads/master/world_universities_and_domains.json';

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch universities');
    const data = await res.json();
    // Map university names only
    return data.map((uni: { name: string }) => uni.name);
  } catch (err) {
    console.error(err);
    return [];
  }
};
