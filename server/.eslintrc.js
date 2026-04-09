module.exports = {
  env: { node: true, es2022: true },
  parserOptions: { ecmaVersion: 2022 },
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-var': 'error',
    eqeqeq: 'error',
    'no-console': 'warn',
  },
}
