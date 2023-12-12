module.exports = {
  extends: [
    'airbnb',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:sonarjs/recommended',
  ],
  plugins: ['@typescript-eslint', 'unused-imports', 'sonarjs'],
  parser: '@typescript-eslint/parser',
  rules: {
    'import/no-unresolved': 'off',
    'no-useless-constructor': 'off',
    'max-len': 'off',
    // unused imports cfg
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'error',
      {
        vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_|(ctx)|(evt)',
      },
    ],
    // end unused imports cfg
    'import/extensions': 'off',
    'import/prefer-default-export': 'off',
    'no-restricted-syntax': 'off',
    'class-methods-use-this': 'off',
    'no-plusplus': 'off',
    'no-bitwise': 'off',
    'no-case-declarations': 'off',
    // shadow fix
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': 'error',
    // end shadow fix
    'no-continue': 'off',
    'no-underscore-dangle': 'off',
    // Padding lines
    'padding-line-between-statements': [
      'error',
      { blankLine: 'always', prev: '*', next: 'return' },
      { blankLine: 'always', prev: ['const', 'let', 'var', 'block-like', 'if'], next: '*' },
      { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
      { blankLine: 'always', prev: ['expression'], next: '*' },
      { blankLine: 'any', prev: ['expression'], next: ['expression'] },
    ],
    // Cognitive complexity
    'sonarjs/cognitive-complexity': 'error',
  },
  root: true,
  ignorePatterns: [
    'node_modules',
    'build/**',
    'dist/**',
  ],
  overrides: [
    {
      files: [
        'index.ts',
      ],
      rules: {
        'import/first': 0,
        '@typescript-eslint/no-var-requires': 0,
      },
    },
    {
      files: 'errors.ts',
      rules: {
        'max-classes-per-file': 'off',
      },
    },
  ],
};
