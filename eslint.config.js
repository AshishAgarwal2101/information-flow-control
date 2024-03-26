const infoFlowPlugin = require("./packages/info-flow");
const typescriptEsLintPlugin = require("@typescript-eslint/eslint-plugin");
const typescriptParser = require("@typescript-eslint/parser");

module.exports = [
    {
        "languageOptions": {
            "sourceType": "commonjs",
            "ecmaVersion": "latest",
            "parser": typescriptParser,
            "parserOptions": {
                "ecmaVersion": 2018,
                "sourceType": "module",
                "project": true,
                "tsconfigRootDir": "__dirname"
            }
        },
        "files": ["**/*.js", "**/**/*.js", "**/*.ts", "**/**/*.ts"],
        "plugins": {
            "@typescript-eslint": typescriptEsLintPlugin,
            "info-flow": infoFlowPlugin
        },
        "rules": {
            'info-flow/my-custom-rule': 'error',
            // '@typescript-eslint/no-explicit-any': 'warn'
        },
        // "extends": ['eslint:recommended', 'plugin:@typescript-eslint/recommended-type-checked'],
        
        "settings": {
            "typescriptVersion": "^4.6.2"
        }
    }
]