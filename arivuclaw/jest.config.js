/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  moduleNameMapper: {
    "^@core/(.*)$": "<rootDir>/src/core/$1",
    "^@channels/(.*)$": "<rootDir>/src/channels/$1",
    "^@skills/(.*)$": "<rootDir>/src/skills/$1",
    "^@memory/(.*)$": "<rootDir>/src/memory/$1",
    "^@security/(.*)$": "<rootDir>/src/security/$1",
    "^@utils/(.*)$": "<rootDir>/src/utils/$1",
    "^@tools/(.*)$": "<rootDir>/src/tools/$1",
  },
};
