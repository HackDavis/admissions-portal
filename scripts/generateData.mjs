import { faker } from '@faker-js/faker';
import data from '../app/_data/db_validation_data.json' with { type: 'json' };

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
      levelOfStudy: faker.helpers.arrayElement(levelOfStudyOptions),
      major: faker.helpers.arrayElement(majors),
      minorOrDoubleMajor: faker.datatype.boolean()
        ? faker.helpers.arrayElement(majors)
        : '',
      college: faker.helpers.arrayElements(colleges, { min: 1, max: 2 }),
      year: faker.helpers.arrayElement(years),
      shirtSize: faker.helpers.arrayElement(shirtSizes),
      dietaryRestrictions: faker.helpers.arrayElements(
        dietaryRestrictionOptions
      ),
      connectWithSponsors: faker.datatype.boolean(),
      gender: faker.helpers.arrayElements(genderOptions, { min: 1, max: 1 }),
      race: faker.helpers.arrayElements(raceOptions),
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
