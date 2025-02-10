import type {Config} from 'jest';

const config: Config = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  coverageReporters: ['text', 'html', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  preset: 'ts-jest',
  testEnvironment: "jest-environment-node",
  setupFilesAfterEnv: ["./test/setup.ts"],
};

export default config;
