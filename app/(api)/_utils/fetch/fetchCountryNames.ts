export const fetchCountryNames = async (): Promise<string[]> => {
  const url =
    'https://raw.githubusercontent.com/lukes/ISO-3166-Countries-with-Regional-Codes/master/all/all.csv';

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch countries');

    const csvText = await res.text();

    const lines = csvText.split('\n').slice(1); // skip header
    const countries: string[] = lines
      .map((line) => {
        if (!line || !line.trim()) return null; // skip empty/null lines

        const match = line.match(/^"?(.*?)"?,/);
        if (!match || !match[1]) return null; // skip if no match or empty

        const name = match[1].trim();
        return name || null; // ensure non-empty string
      })
      .filter((name): name is string => Boolean(name)) // remove nulls
      .sort((a, b) => a.localeCompare(b));

    return countries;
  } catch (err) {
    console.error(err);
    return [];
  }
};
