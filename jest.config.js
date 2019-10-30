module.exports = {
  preset: "ts-jest/presets/js-with-ts",
  testMatch: [
    "<rootDir>/packages/**/__tests__/**/*.(ts)",
    "<rootDir>/packages/**/*.(spec|test).(ts)",
  ],
  testPathIgnorePatterns: ["/node_modules/", "/__tests__/(.+/)?data/", "/__tests__/(.+/)?utils/"],
  collectCoverage: true,
  coveragePathIgnorePatterns: ["/node_modules/", "/__tests__/"],
  moduleNameMapper: {
    "@vta/(.*)": "<rootDir>/packages/$1/src",
  },
};
