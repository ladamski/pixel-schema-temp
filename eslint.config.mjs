import globals from 'globals';
import ddgConfig from '@duckduckgo/eslint-config';

export default [
    ...ddgConfig,
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
    },
    {
        files: ['**/tests/*.mjs'],
        languageOptions: {
            globals: {
                ...globals.mocha,
            },
        },
        rules: {
            'no-unused-expressions': 'off',
        },
    },
];
