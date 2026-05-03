module.exports = {
  preset: 'jest-expo',
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};