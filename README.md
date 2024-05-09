# Gradual Typing for Information Flow Control in Typescript using ESLint

## This project provides Information Flow Control in Typescript
* Unlike custom implementations, you don't need to learn new syntaxes.
* It provides static analysis of developers' code and detect security vulnerabilities.
* Available as a simple library.

### Setting up node
* Install Node.js v20.11.0: https://nodejs.org
* ```npm install```

### Running:
* Typescript conversion to javascript: ```npm run ts```
* Running linting rules: ```npm run lint -- <filename>```
    * e.g. ```npm run lint -- src/TransactionSystem.ts```

### Important files:
* ```eslint.config.js```: ESLint configuration
* ```src/SecurityTypes.ts```: Contain exports that can be used to tag variables to security levels H (private) and L (public).
* ```packages/info-flow/index.js```: ESLint code to check for security vulnerabilities in a program.
* ```src/ClassroomGrades.ts```, ```src/HealthcareSystem.ts``` and ```src/TransactionSystem.ts```: Experimental use cases
```src/InformationLeakProblem.ts```: Examples of several information leakages that can be detected by our linting tool.

### Useful links:
* Add ES Lint package: https://dev.to/devsmitra/how-to-create-a-custom-eslint-plugin-3bom
* ES Lint AST Playground: https://typescript-eslint.io/
* ES Lint Docs custom rules:
    * https://eslint.org/docs/latest/extend/custom-rules
    * https://eslint.org/docs/latest/extend/scope-manager-interface