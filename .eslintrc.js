module.exports = {
  extends: ['eslint:recommended', 'plugin:react/recommended'],
  plugins: ['react'],

  rules: {
    'react/prop-types': 0,
    'no-unused-vars': ['error'],
    'react/display-name': 0
  },
  parserOptions: {
    ecmaVersion: 2015,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  env: {
    es6: true,
    browser: true,
    node: true,
    webextensions: true
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
}
