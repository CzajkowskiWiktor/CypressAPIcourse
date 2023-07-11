const { defineConfig } = require('cypress')

module.exports = defineConfig({
  projectId: 'obgcdn',
  viewportHeight: 1080,
  viewportWidth: 1920,
  env: {
    userEmail: 'artem.bondar16@gmail.com',
    password: 'CypressTest1',
    apiUrl: 'https://api.realworld.io'
  },

  e2e: {
    baseUrl: 'http://localhost:4200',
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
    excludeSpecPattern: ['**/1-getting-started/*', '**/2-advanced-examples/*']
  },
})