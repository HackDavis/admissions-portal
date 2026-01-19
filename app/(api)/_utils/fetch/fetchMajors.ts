export const fetchMajors = async (): Promise<string[]> => {
  const url =
    'https://raw.githubusercontent.com/fivethirtyeight/data/master/college-majors/majors-list.csv';

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch majors list');

    const text = await res.text();

    const lines = text.split('\n').slice(1);

    // takeo out majors
    const majors = lines
      .map((line) => {
        const parts = line.split(',');
        return parts.slice(1).join(',').trim();
      })
      .filter((m) => m.length > 0);

    return majors.sort();
  } catch (err) {
    console.error(err);
    return [];
  }
};
