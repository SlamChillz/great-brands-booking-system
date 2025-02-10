import type {Config} from 'jest';

const config: Config = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  preset: 'ts-jest',
  testEnvironment: "jest-environment-node",
  setupFilesAfterEnv: ["./test/setup.ts"],
};

export default config;
