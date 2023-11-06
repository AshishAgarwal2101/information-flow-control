module.exports = {
    "env": {
        "browser": true,
        "es6": true
    },
    "parser": "@typescript-eslint/parser",
    "plugins": [
        '@typescript-eslint',
        'info-flow'
    ],
    "rules": {
        'info-flow/my-custom-rule': 'error',
        // '@typescript-eslint/no-explicit-any': 'warn'
    },
    // "extends": ['eslint:recommended', 'plugin:@typescript-eslint/recommended-type-checked'],
    "parserOptions": {
        "ecmaVersion": 2018,
        "sourceType": "module",
        "project": true,
        "tsconfigRootDir": "__dirname"
    },
    "settings": {
        "typescriptVersion": "^4.6.2"
    }
}