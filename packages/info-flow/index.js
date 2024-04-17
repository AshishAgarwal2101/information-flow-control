const utils = require("@typescript-eslint/utils");

module.exports = {
  rules: {
    'my-custom-rule': {
      create(context) {
        const variableSecurityLevelMap = new Map();
        const propertyMap = new Map();

        return {
          IfStatement(node) {
            const services = utils.ESLintUtils.getParserServices(context);
            const scope = context.getScope();
            const comments = context.getSourceCode().getCommentsInside(node);
            
            if (containsHighSecurityIdentifier(
              services, node.test, scope, propertyMap)) {
              const assignmentExpressions = getAllAssignments(node.consequent);

              assignmentExpressions.forEach(assignmentExpression => {
                if (!isIgnoreApplied(comments, assignmentExpression) && isAssigningToPublic(services, assignmentExpression, scope, propertyMap)) {
                  context.report(assignmentExpression, 
                    "Public assignment in a protected block");
                }

                const isHighSecurity = isPrivateAssignment(assignmentExpression);
                const oldSecurity = variableSecurityLevelMap
                  .get(assignmentExpression.left ? assignmentExpression.left.name : assignmentExpression.id.name);
                if(!isIgnoreApplied(comments, assignmentExpression) && oldSecurity !== "H" && isHighSecurity) {
                  context.report(assignmentExpression, "Sensitive Upgrade detected");
                }
              });
            }
          },
          VariableDeclarator: function (node) {
            let isHighSecurity = isPrivateAssignment(node);
            variableSecurityLevelMap.set(node.id.name, isHighSecurity ? "H" : "L");
          },
          AssignmentExpression: function (node) {
            const isHighSecurity = isPrivateAssignment(node);
            variableSecurityLevelMap.set(node.left.name, isHighSecurity ? "H" : "L");
          },
          ThrowStatement(node) {
            const services = utils.ESLintUtils.getParserServices(context);
            const commentsBefore = context.getSourceCode().getCommentsBefore(node);
            const scope = context.getScope();

            if(isIgnoreApplied(commentsBefore, node)) {
              return;
            }
            
            if (node.argument && node.argument.type === 'NewExpression' && 
              node.argument.callee.name === 'Error') {
              const errorMessageNode = node.argument.arguments && 
                node.argument.arguments.length > 0 ? node.argument.arguments[0] : null;
              const types = getVariableTypesFromNode(services, errorMessageNode, scope, propertyMap);
              if(types.includes("SecurityTypeHigh")) {
                context.report({
                  node,
                  message: 
                    "High security values cannot be passed as an error parameter",
                });
              }
            }
          },
          CallExpression(node) { //console.log()
            const services = utils.ESLintUtils.getParserServices(context);
            const commentsBefore = context.getSourceCode().getCommentsBefore(node);
            const scope = context.getScope();

            if(isIgnoreApplied(commentsBefore, node)) {
              return;
            }

            if (node.callee.type === 'MemberExpression' && node.callee.object.name === 'console' && node.callee.property.name === 'log') {
              const consoleNode = node.arguments && node.arguments.length > 0 ? node.arguments[0] : null;
              const types = getVariableTypesFromNode(services, consoleNode, scope, propertyMap);
              if(types.includes("SecurityTypeHigh")) {
                context.report({
                  node,
                  message: "High security values cannot be passed as a log parameter",
                });
              }
            }
          },
          PropertyDefinition(node) {
            const variableName = node.key.name;
            const typeAnnotation = context.getSourceCode().getText(node.typeAnnotation)?.replace(": ", "")?.replace(" ", "");
            if(variableName && typeAnnotation) propertyMap.set(variableName, typeAnnotation);
          }
        };
      }
    }
  }
}

const getVariableTypesFromNode = (services, variableNode, scope, propertyMap) => {
  if(!services || !variableNode) return [];
  const varObjects = getNodeObjects(variableNode);
  const classProperties = getNodeClassProperty(variableNode);

  //using symbol
  let varTypes = varObjects.map(varObject => services.getTypeAtLocation(varObject));
  varTypes = varTypes.flatMap((varType) => {
    if(!varType.symbol && varType.types) return varType.types;
    if(!varType.symbol) return [];
    return [varType];
  });
  const symbols = varTypes.map((type) => type?.symbol);
  let types = symbols.map((symbol) => symbol?.escapedName);
  types = types.filter((type) => type);
  
  //using variable name
  const typesWithScope = varObjects.flatMap(varObject => getVariableTypes(scope, varObject?.object?.name));

  //using class properties
  const classPropertyAnnotations = classProperties
      .map(classProperty => propertyMap.get(classProperty.name))
      .filter(annotation => annotation);

  return [...types, ...typesWithScope, ...classPropertyAnnotations];
};

const getNodeObjects = (node) => {
  if(!node) return [];
  if(node.type === "Identifier") return [node];
  if(node.object?.type === "Identifier") return [node.object];
  if(!node.left && !node.right && !node.object) return [];
  
  let allNodeObjects = [];
  let leftNodeObjects = getNodeObjects(node.left);
  let rightNodeObjects = getNodeObjects(node.right);
  let objectNodeObjects = getNodeObjects(node.object);
  allNodeObjects = leftNodeObjects ? allNodeObjects.concat(leftNodeObjects) : allNodeObjects;
  allNodeObjects = rightNodeObjects ? allNodeObjects.concat(rightNodeObjects) : allNodeObjects;
  allNodeObjects = objectNodeObjects ? allNodeObjects.concat(objectNodeObjects) : allNodeObjects;
  return allNodeObjects;
};

const getNodeClassProperty = (node) => {
  if(!node) return [];
  if(node.property && node?.object?.type === "ThisExpression") return [node.property];
  if(!node.left && !node.right && !node.object) return [];
  
  let allNodeClassProperties = [];
  let leftNodeClassProperties = getNodeClassProperty(node.left);
  let rightNodeClassProperties = getNodeClassProperty(node.right);
  let objectNodeClassProperties = getNodeClassProperty(node.object);
  allNodeClassProperties = leftNodeClassProperties ? allNodeClassProperties.concat(leftNodeClassProperties) : allNodeClassProperties;
  allNodeClassProperties = rightNodeClassProperties ? allNodeClassProperties.concat(rightNodeClassProperties) : allNodeClassProperties;
  allNodeClassProperties = objectNodeClassProperties ? allNodeClassProperties.concat(objectNodeClassProperties) : allNodeClassProperties;
  return allNodeClassProperties;
};

const getVariableTypes = (scope, varName) => {
  const types = [];
  const variable = scope.variables.find(v => v.name === varName);
  if(!scope || !varName) return  types;
  if(!variable) return types;

  //when type annotation present for the variable and only a single type declared
  const singleType = variable?.identifiers[0].typeAnnotation?.typeAnnotation?.typeName?.name
  if(singleType) {
    types.push(singleType);
    return types;
  }

  //when variable is defined using a function call to the SecurityWrapper
  let variableDefinitions = (variable?.defs && variable.defs.length > 0) ? (variable.defs.map((variableDef) => variableDef?.node?.init)) : null; //accessing the last definition
  let variableSecutiyDefinitions = variableDefinitions?.filter((variableDef) => variableDef?.callee?.name === "SecurityWrapper");
  if(variableSecutiyDefinitions && variableSecutiyDefinitions.length > 0) {
    let isHighSecurityDefinitionAvailable = variableSecutiyDefinitions.some((variableDef) => {
      return variableDef.arguments[1].value === "H";
    })
    
    if(isHighSecurityDefinitionAvailable) {
      return ["SecurityTypeHigh"];
    }
    else {
      return ["SecurityTypeLow"];
    }
  }

  //when type annotation present for the variable and multiple types declared
  const multipleTypeObjects = variable?.identifiers[0].typeAnnotation?.typeAnnotation?.types;
  if(!multipleTypeObjects) return types;
  return multipleTypeObjects
    .map((typeObj) => typeObj?.typeName?.name)
    .filter((typeName) => typeName);
};

const getSecurityLevelOfAssignment = (assignmentExpression) => {
  let variableDefinition = assignmentExpression.right;
  if(variableDefinition.type === "CallExpression" && variableDefinition?.callee?.name === "SecurityWrapper") {
    if(variableDefinition.arguments[1].value === "H") return "H";
  }

  return "L";
};

function containsHighSecurityIdentifier(services, node, scope, propertyMap) {
  let variableTypes = getVariableTypesFromNode(services, node, scope, propertyMap);
  return variableTypes.includes("SecurityTypeHigh");
}

const getAllAssignments = (nodeConsequent) => {
  if(!nodeConsequent) return [];
  const nodes = nodeConsequent.body ? nodeConsequent.body : [nodeConsequent];
  const variableDeclarations = nodes
    .filter((node) => node.type === "VariableDeclaration")
    .flatMap((node) => node.declarations)
    .filter((node) => node.type === "VariableDeclarator");
  const expressions = nodes.map((node) => node.expression);
  const assignments = expressions.filter((expression) => expression && (expression.type === 'AssignmentExpression'));
  return [...variableDeclarations, ...assignments];
};

const isAssigningToPublic = (services, assignmentExpression, scope, propertyMap) => {
  if(assignmentExpression.type === "VariableDeclarator") {
    return !isPrivateAssignment(assignmentExpression);
  }
  else if (assignmentExpression.left.type === 'Identifier' || assignmentExpression.left.type === "MemberExpression") {
    let variableTypes = getVariableTypesFromNode(services, assignmentExpression.left, scope, propertyMap);
    return !variableTypes.includes("SecurityTypeHigh") && getSecurityLevelOfAssignment(assignmentExpression) !== "H";
  };

  return false;
}

const isIgnoreApplied = (comments, node) => {
  let commentLineNumberSet = new Set(
    comments
      .filter((comment) => comment.value.trim() === "@IgnoreInformationFlow")
      .map((comment) => getNodeLineNumbers(comment).start)
  );

  let nodeLineNumbers = getNodeLineNumbers(node);
  return commentLineNumberSet.has(nodeLineNumbers.start - 1); //ignore comment present just above the node
};

const getNodeLineNumbers = (node) => {
  return {
    start: node.loc.start.line,
    end: node.loc.end.line
  }
};

const isPrivateAssignment = (node) => {
  const nodeInit = node.init ? node.init : node.right;
  if(!nodeInit) return false;
  return nodeInit.callee?.name === "SecurityWrapper" && nodeInit.arguments[1].value === "H";
}