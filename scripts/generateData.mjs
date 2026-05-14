import data from '../app/_data/db_validation_data.json' with { type: 'json' };

const years = [...new Set(data.years)];
const shirtSizes = [...new Set(data.shirtSizes)];
const statuses = [...new Set(data.statuses)];

const firstNames = [
  'Haylie',
  'Michelle',
  'Kelly',
  'Sandeep',
  'Afifah',
  'Jamie',
  'Jordan',
  'Alex',
  'Jack',
  'Win',
  'Austin',
  'Brandon',
];
const lastNames = [
  'Tan',
  'Yeoh',
  'Tran',
  'Wu',
  'Mai',
  'Nguyen',
  'Lu',
  'Liu',
  'Yu',
  'Smith',
  'Le',
  'Lee',
];
const universities = [
  'University of California Davis',
  'University of California, Berkeley',
  'University of California, Los Angeles',
  'California State University, Sacramento',
  'Stanford University',
  'San Jose State University',
];
const majors = [
  'Computer Science',
  'Computer Engineering',
  'Electrical Engineering',
  'Data Science',
  'Design',
  'Cognitive Science',
  'Business',
];
const levelOfStudyOptions = [
  'Undergraduate University (2 year - community college or similar)',
  'Undergraduate University (3+ year)',
  'Graduate University (Masters, Professional, Doctoral, etc)',
  'Code School / Bootcamp',
  'Other Vocational / Trade Program or Apprenticeship',
  'Post Doctorate',
  'Other',
  'I am not currently a student',
];
const dietaryRestrictionOptions = [
  'None',
  'Vegetarian',
  'Vegan',
  'Gluten Free',
  'Halal',
  'Kosher',
  'Nut Allergy',
];
const genderOptions = ['Woman', 'Man', 'Non-binary', 'Prefer not to answer'];
const raceOptions = [
  'Asian',
  'Black or African American',
  'Hispanic or Latino',
  'Middle Eastern or North African',
  'White',
  'Prefer not to answer',
];
const colleges = [
  'Engineering',
  'Letters and Science',
  'Biological Sciences',
  'Agricultural and Environmental Sciences',
];

const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomElement = (items) => items[randomInt(0, items.length - 1)];

const shuffle = (items) => {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const randomElements = (items, min, max = min) =>
  shuffle(items).slice(0, randomInt(min, max));

const randomBoolean = () => Math.random() > 0.5;

const randomDateBetween = (from, to) => {
  const fromTime = new Date(from).getTime();
  const toTime = new Date(to).getTime();
  return new Date(randomInt(fromTime, toTime));
};

const randomEmail = (index) => `seed.${index}.${Date.now()}@example.com`;

const randomPhone = () =>
  `+1${randomInt(200, 999)}${randomInt(200, 999)}${randomInt(1000, 9999)}`;

function generateApplications(numDocuments) {
  return Array.from({ length: numDocuments }, (_, index) => {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const age = randomInt(17, 25);

    return {
      email: randomEmail(index + 1),
      firstName,
      lastName,
      phone: randomPhone(),
      age,
      isOver18: age >= 18,
      isUCDavisStudent: randomBoolean(),
      university: randomElement(universities),
      countryOfResidence: 'United States of America',
      levelOfStudy: randomElement(levelOfStudyOptions),
      major: randomElement(majors),
      minorOrDoubleMajor: Math.random() > 0.65 ? randomElement(majors) : '',
      college: randomElements(colleges, 1, 2),
      year: randomElement(years),
      shirtSize: randomElement(shirtSizes),
      dietaryRestrictions: randomElements(dietaryRestrictionOptions, 1, 2),
      connectWithSponsors: randomBoolean(),
      gender: randomElements(genderOptions, 1),
      race: randomElements(raceOptions, 1, 2),
      attendedHackDavis: randomBoolean(),
      firstHackathon: randomBoolean(),
      linkedin: `https://www.linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}-${
        index + 1
      }`,
      githubOrPortfolio:
        Math.random() > 0.4
          ? `https://github.com/${firstName.toLowerCase()}${lastName.toLowerCase()}${
              index + 1
            }`
          : '',
      resume: '',
      connectWithHackDavis: randomBoolean(),
      connectWithMLH: randomBoolean(),
      mlhAgreements: {
        mlhCodeOfConduct: true,
        eventLogisticsInformation: true,
      },
      status: randomElement(statuses),
      wasWaitlisted: false,
      submittedAt: randomDateBetween(
        '2026-03-01T00:00:00.000Z',
        '2026-05-01T07:59:59.999Z'
      ),
    };
  });
}

function generateMailchimp() {
  return [
    {
      batchNumber: 0,
      apiCallsMade: 0,
      maxApiCalls: 1500,
      apiKeyIndex: 1,
      maxApiKeys: 4,
      lastUpdate: new Date(0),
      lastReset: new Date(0),
    },
  ];
}

function generateData(collectionName, numDocuments) {
  if (collectionName === 'applications') {
    return generateApplications(numDocuments);
  }

  if (collectionName === 'mailchimp') {
    return generateMailchimp();
  }

  throw new Error(
    `Unsupported seed collection "${collectionName}". Use applications or mailchimp.`
  );
}

export default generateData;
