const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
        },
      },
    ],
    '^.+\\.(mjs|js|jsx)$': 'babel-jest',
  },
  testMatch: ['**/?(*.)+(spec|test).(ts|tsx)'],
  clearMocks: true,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'mjs'],
  moduleNameMapper: {
    '^@globals/(.*)$': '<rootDir>/app/(pages)/_globals/$1',
    '^@components/(.*)$': '<rootDir>/app/(pages)/_components/$1',
    '^@data/(.*)$': '<rootDir>/app/_data/$1',
    '^@hooks/(.*)$': '<rootDir>/app/(pages)/_hooks/$1',
    '^@actions/(.*)$': '<rootDir>/app/(api)/_actions/$1',
    '^@utils/(.*)$': '<rootDir>/app/(api)/_utils/$1',
    '^@apidata/(.*)$': '<rootDir>/app/(api)/_data/$1',
    '^@datalib/(.*)$': '<rootDir>/app/(api)/_datalib/$1',
    '^@typeDefs/(.*)$': '<rootDir>/app/_types/$1',
    '^@/auth$': '<rootDir>/auth.ts',
    '^@public/(.*)$': '<rootDir>/public/$1',
    '\\.(css|scss|sass)$': 'identity-obj-proxy',
  },
};

module.exports = config;
