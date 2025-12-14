// jest.config.js
export default {
  testEnvironment: 'node',
  
  testMatch: [
    '<rootDir>/test/**/*.test.js'
  ],
  
  transform: {
    '^.+\\.js$': ['babel-jest', {
      configFile: './babel.config.cjs'
    }]
  },
  
  transformIgnorePatterns: [
    '/node_modules/(?!dolphinjs)/'
  ],
  
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  
  moduleNameMapper: {
    '^dolphinjs$': '<rootDir>/index.js',
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  
  // extensionsToTreatAsEsm हटाउनुहोस् - Jest ले आफैँ handle गर्छ
  // extensionsToTreatAsEsm: ['.js'], // यो लाइन हटाउनुहोस्
  
  moduleFileExtensions: ['js', 'json', 'node'],
  
  testEnvironmentOptions: {
    url: 'http://localhost'
  },
  
  verbose: true,
  testTimeout: 10000
};