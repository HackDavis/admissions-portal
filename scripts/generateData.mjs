import { faker } from '@faker-js/faker';
import data from '../app/_data/db_validation_data.json' with { type: 'json' };
import {
  GENDER_OPTIONS,
  RACE_OPTIONS,
} from '../app/(pages)/(admissions)/_components/ApplicationCarousel/slides/Diversity.tsx';
import {
  COLLEGE_OPTIONS,
  LEVEL_OF_STUDY_OPTIONS,
} from '../app/(pages)/(admissions)/_components/ApplicationCarousel/slides/KeepGoing.tsx';

const years = [...new Set(data.years)];
const shirtSizes = [...new Set(data.shirtSizes)];

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
const dietaryRestrictionOptions = [
  'None',
  'Vegetarian',
  'Vegan',
  'Gluten Free',
  'Halal',
  'Kosher',
  'Nut Allergy',
];
function generateApplications(numDocuments) {
  return Array.from({ length: numDocuments }, (_, index) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const age = faker.number.int({ min: 17, max: 25 });

    // return as app type
    return {
      email: faker.internet.email(),
      firstName,
      lastName,
      phone: `+1${faker.string.numeric(10)}`,
      age,
      isOver18: age >= 18,
      isUCDavisStudent: faker.datatype.boolean(),
      university: faker.helpers.arrayElement(universities),
      countryOfResidence: 'United States of America',
      levelOfStudy: faker.helpers.arrayElement(LEVEL_OF_STUDY_OPTIONS),
      major: faker.helpers.arrayElement(majors),
      minorOrDoubleMajor: faker.datatype.boolean()
        ? faker.helpers.arrayElement(majors)
        : '',
      college: faker.helpers.arrayElements(COLLEGE_OPTIONS, { min: 1, max: 2 }),
      year: faker.helpers.arrayElement(years),
      shirtSize: faker.helpers.arrayElement(shirtSizes),
      dietaryRestrictions: faker.helpers.arrayElements(
        dietaryRestrictionOptions
      ),
      connectWithSponsors: faker.datatype.boolean(),
      gender: faker.helpers.arrayElements(GENDER_OPTIONS, { min: 1, max: 1 }),
      race: faker.helpers.arrayElements(RACE_OPTIONS),
      attendedHackDavis: faker.datatype.boolean(),
      firstHackathon: faker.datatype.boolean(),
      linkedin: `https://www.linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}-${
        index + 1
      }`,
      githubOrPortfolio: faker.datatype.boolean()
        ? `https://github.com/${firstName.toLowerCase()}${lastName.toLowerCase()}${
            index + 1
          }`
        : '',
      resume: '',
      connectWithHackDavis: faker.datatype.boolean(),
      connectWithMLH: faker.datatype.boolean(),
      mlhAgreements: {
        mlhCodeOfConduct: true,
        eventLogisticsInformation: true,
      },
      status: 'pending',
      wasWaitlisted: false,
      submittedAt: faker.date.between({
        from: '2026-03-01T00:00:00.000Z',
        to: '2026-05-01T07:59:59.999Z',
      }),
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
      lastUpdate: new Date(),
      lastReset: new Date(),
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
