const utils = require("@typescript-eslint/utils");

module.exports = {
  rules: {
    'my-custom-rule': {
      create(context) {
        const variables = new Set();
        const variableSecurityLevelMap = new Map();

        return {
          IfStatement(node) {
            const services = utils.ESLintUtils.getParserServices(context);
              const type = services.getTypeAtLocation(node.test.object);
              const scope = context.getScope();
              const symbol = (node.test.object?.name) ? services.getSymbolAtLocation(node.test.object) : null;
              const comments = context.getSourceCode().getCommentsInside(node);
              
              if (containsHighSecurityIdentifier(scope, node.test)) {
                const assignmentExpressions = getAllAssignments(node.consequent.body);

                assignmentExpressions.forEach(assignmentExpression => {
                  if (!isIgnoreApplied(comments, assignmentExpression) && isAssigningToPublic(scope, assignmentExpression)) {
                    context.report(assignmentExpression, "Public assignment in a protected block");
                  }

                  const isHighSecurity = isPrivateAssignment(assignmentExpression);
                  //let isHighSecurity = node.right.callee?.name === "SecurityWrapper" && node.right.arguments[1].value === "H";
                  const oldSecurity = variableSecurityLevelMap.get(assignmentExpression.left.name);
                  if(!isIgnoreApplied(comments, assignmentExpression) && oldSecurity !== "H" && isHighSecurity) {
                    context.report(assignmentExpression, "Sensitive Upgrade detected");
                  }
                  // if(isSecurityUpgrade(scope, assignmentExpression)) {
                  //   context.report(assignmentExpression, 'Security Upgrade detected');
                  // }
                });
              }
          },
          // FunctionDeclaration: function (node) {
          //   if (node.id.name === 'leak') {
          //     const params = node.params;

          //     if (params.length !== 1 || params[0].name !== 'secret') {
          //       context.report({
          //         node: node,
          //         message: 'leak function signature must be leak(secret)'
          //       });
          //     }
          //   }
          // },
          VariableDeclarator: function (node) {
            const scope = context.getScope();
            let isHighSecurity = isPrivateAssignment(node);
            variableSecurityLevelMap.set(node.id.name, isHighSecurity ? "H" : "L");
          },
          AssignmentExpression: function (node) {
            const isHighSecurity = isPrivateAssignment(node);
            variableSecurityLevelMap.set(node.left.name, isHighSecurity ? "H" : "L");
            
            //the rule to check no sensitive upgrade is written above in the check for "If" statements
          },
          ThrowStatement(node) {
            const services = utils.ESLintUtils.getParserServices(context);
            const commentsBefore = context.getSourceCode().getCommentsBefore(node);
            const scope = context.getScope();

            if(isIgnoreApplied(commentsBefore, node)) {
              return;
            }
            
            if (node.argument && node.argument.type === 'NewExpression' && node.argument.callee.name === 'Error') {
              const errorMessageNode = node.argument.arguments && node.argument.arguments.length > 0 ? node.argument.arguments[0] : null;
              const types = getVariableTypesFromSymbol(services, errorMessageNode, scope);
              if(types.includes("SecurityTypeHigh")) {
                context.report({
                  node,
                  message: "High security values cannot be passed as an error parameter",
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
              const types = getVariableTypesFromSymbol(services, consoleNode, scope);
              if(types.includes("SecurityTypeHigh")) {
                context.report({
                  node,
                  message: "High security values cannot be passed as a log parameter",
                });
              }
            }
          },
          // 'Program:exit': function () {
          //   variables.forEach((variableData) => {
          //     let {scope, node} = variableData;
          //     //console.log("Variable:: ", variable);
          //     isSecurityUpgrade(scope, node.id.name);
          //   });
          // },
          // Program: function(node) {
          //   const assignmentExpressions = getAllAssignments(node.consequent.body);
          //   assignmentExpressions.forEach(assignmentExpression => {
          //     if(isSecurityUpgrade(scope, assignmentExpression)) {
          //       context.report(assignmentExpression, 'Security Upgrade detected');
          //     }
          //   });
          // }
        };
      }
    }
  }
}

const getVariableTypesFromSymbol = (services, variableNode, scope) => {
  if(!services || !variableNode) return [];
  const varObjects = getNodeObjects(variableNode);

  //this way, without using variable name - in this case, SecurityWrapper call is not considered
  let varTypes = varObjects.map(varObject => services.getTypeAtLocation(varObject));
  varTypes = varTypes.flatMap((varType) => {
    if(!varType.symbol && varType.types) return varType.types;
    if(!varType.symbol) return [];
    return [varType];
  });
  const symbols = varTypes.map((type) => type?.symbol);
  let types = symbols.map((symbol) => symbol?.escapedName);
  types = types.filter((type) => type);
  
  const typesWithScope = varObjects.flatMap(varObject => getVariableTypes(scope, varObject?.object?.name));
  return [...types, ...typesWithScope];
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

function containsHighSecurityIdentifier(scope, node) {
  let nodeObjects = getNodeObjects(node);
  for(let i=0; i<nodeObjects.length; i++) {
    let nodeObj = nodeObjects[i];
    
    if(nodeObj.type === "Identifier") {
      let variableTypes = getVariableTypes(scope, nodeObj.name);
      
      if(variableTypes.length === 0) return true; //if variable type cannot be determined, assume it to be SecurityTypeHigh
      for(let i=0; i<variableTypes.length; i++) {
        if(variableTypes[i] === "SecurityTypeHigh") {
          return true;
        }
      }
    }
    else {
      return node.children?.some(containsHighSecurityIdentifier);
    }
  }
  return false;
}

const getObjectNodesFromExpression = (node) => {
  let objectNode = node.object;
  if(objectNode) {
    return [objectNode];
  }

  let nodes = [];
  let leftNode = node?.left?.object;
  let rightNode = node?.right?.object;
  if(leftNode) nodes.push(leftNode);
  if(rightNode) nodes.push(rightNode);
  return nodes;
}

const getAllAssignments = (nodes) => {
  if(!nodes) return [];
  const expressions = nodes.map((node) => node.expression);
  return expressions.filter((expression) => expression && expression.type === 'AssignmentExpression');
};

const isAssigningToPublic = (scope, assignmentExpression) => {
  if (assignmentExpression.left.type === 'Identifier') {
    let variableTypes = getVariableTypes(scope, assignmentExpression.left.name);
    return !variableTypes.includes("SecurityTypeHigh") && getSecurityLevelOfAssignment(assignmentExpression) !== "H";
  };

  return false;
}

const isSecurityUpgrade = (scope, varName) => {
  const variable = scope.variables.find(v => v.name === varName);
  let variableDefinitions = (variable?.defs && variable.defs.length > 0) ? (variable.defs.map((variableDef) => variableDef?.node?.init)) : null;

  let lastSecurityLevel = null;
  for(let variableDef in variableDefinitions) {
    let isHighSecurity = variableDef?.callee?.name === "SecurityWrapper" && variableDef.arguments[1].value === "H";
    if(lastSecurityLevel === null) {
      lastSecurityLevel = isHighSecurity ? "H" : "L";
    }
    else if(lastSecurityLevel === "L" && isHighSecurity) {
      return true;
    }
  }

  return false;
};

const isSecurityUpgrade1 = (scope, assignmentExpression) => {
  let oldLevel = getVariableTypes(scope, assignmentExpression.left.name).includes("SecurityTypeHigh") ? "H" : "L";
  let newLevel = getSecurityLevelOfAssignment(assignmentExpression);
  if(newLevel === "H" && oldLevel === "L") return true;
  return false;
};

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