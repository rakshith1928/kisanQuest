/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        // Relax for tests: allow JSON imports, etc.
        resolveJsonModule: true,
        esModuleInterop: true,
      },
    }],
  },
  // Map JSON scenario imports so ts-jest can handle them
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.json$': '$1.json',
  },
};
