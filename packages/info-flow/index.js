const utils = require("@typescript-eslint/utils");

module.exports = {
  rules: {
    'my-custom-rule': {
      create(context) {
        // rule implementation
        return {
          IfStatement(node) {
              const services = utils.ESLintUtils.getParserServices(context);
              const type = services.getTypeAtLocation(node.test.object);
              const scope = context.getScope();
              const symbol = (node.test.object?.name) ? services.getSymbolAtLocation(node.test.object) : null;
              
              if (containsHighSecurityIdentifier(scope, node.test)) {
                const assignmentExpressions = getAllAssignments(node.consequent.body);
                //console.log("Assignment Expressions: ", assignmentExpressions);

                assignmentExpressions.forEach(assignmentExpression => {
                  if (isAssigningToPublic(scope, assignmentExpression)) {
                    context.report(assignmentExpression, 'Assignment to public variable detected in a protected block');
                  }
                });
              }
          },
          FunctionDeclaration: function (node) {
            if (node.id.name === 'leak') {
              const params = node.params;

              if (params.length !== 1 || params[0].name !== 'secret') {
                context.report({
                  node: node,
                  message: 'leak function signature must be leak(secret)'
                });
              }
            }
          }
        };
      }
    }
  }
}

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

const getNodeObjects = (node) => {
  if(node.object) return [node.object];
  if(!node.left && !node.right) return [];

  let allNodeObjects = [];
  let leftNodeObjects = getNodeObjects(node.left);
  let rightNodeObjects = getNodeObjects(node.right);
  allNodeObjects = leftNodeObjects ? allNodeObjects.concat(leftNodeObjects) : allNodeObjects;
  allNodeObjects = rightNodeObjects ? allNodeObjects.concat(rightNodeObjects) : allNodeObjects;
  return allNodeObjects;
};

function containsHighSecurityIdentifier(scope, node) {
  let nodeObjects = getNodeObjects(node);
  
  for(let i=0; i<nodeObjects.length; i++) {
    let nodeObj = nodeObjects[i];
    
    if(nodeObj.type === "Identifier") {
      let variableTypes = getVariableTypes(scope, nodeObj.name);
      
      //console.log("Variable types: ", variableTypes);
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
  const expressions = nodes.map((node) => node.expression);
  return expressions.filter((expression) => expression.type === 'AssignmentExpression');
};

const isAssigningToPublic = (scope, assignmentExpression) => {
  if (assignmentExpression.left.type === 'Identifier') {
    let variableTypes = getVariableTypes(scope, assignmentExpression.left.name);
    // console.log("Variable types for " + assignmentExpression.left.name + " = ");
    // console.log(variableTypes, "\n");
    return !variableTypes.includes("SecurityTypeHigh");
  };

  return false;
}