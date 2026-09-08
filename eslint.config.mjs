// Biome owns general lint and format. ESLint only checks React Compiler safety
// in library source, which consumers compile through Metro. Remove this exception
// when Biome provides an equivalent rule set.
import tsParser from '@typescript-eslint/parser';
import reactCompiler from 'eslint-plugin-react-compiler';

export default [
  {
    files: ['src/components/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' },
    },
    plugins: { 'react-compiler': reactCompiler },
    rules: {
      'react-compiler/react-compiler': ['error', { __unstable_donotuse_reportAllBailouts: true }],
    },
  },
];
