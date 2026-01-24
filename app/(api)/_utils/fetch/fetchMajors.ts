export const fetchMajors = async (): Promise<string[]> => {
  const url =
    'https://raw.githubusercontent.com/fivethirtyeight/data/master/college-majors/majors-list.csv';

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch majors list');

    const text = await res.text();

    const lines = text.split('\n').slice(1);

    // take out majors column
    const majors = lines
      .map((line) => {
        // CSV validation check - at least 2 commas
        const match = line.match(/^(?:[^,"]+|"[^"]*"),(?:[^,"]+|"[^"]*"),/);
        if (!match) return null;

        // Extract the second column (major)
        const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

        const major = cols[1]?.trim();

        // Ignore invalid or N/A entries
        if (
          !major ||
          major.toUpperCase() === "N/A (LESS THAN BACHELOR'S DEGREE)"
        )
          return null;

        // Remove surrounding quotes, if any
        return major.replace(/^"(.*)"$/, '$1');
      })
      .filter((m): m is string => !!m);

    return majors.sort();
  } catch (err) {
    console.error(err);
    return [];
  }
};
