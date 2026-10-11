"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@typescript-eslint/utils");
const tsutils = __importStar(require("ts-api-utils"));
const ts = __importStar(require("typescript"));
const util_1 = require("../util");
const getParentFunctionNode_1 = require("../util/getParentFunctionNode");
const shared_1 = require("./enum-utils/shared");
const assigningOperators = new Set([
    '=',
    '&&=',
    '&=',
    '??=',
    '^=',
    '|=',
    '||=',
]);
const bitwiseOperators = new Set(['&', '^', '|']);
exports.default = (0, util_1.createRule)({
    name: 'no-unsafe-enum-assignment',
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallow assigning non-enum values to enum typed locations',
            recommended: 'strict',
            requiresTypeChecking: true,
        },
        messages: {
            unsafeEnumAccess: 'The computed key used here does not have a shared enum type with the expected enum {{enumNames}}.',
            unsafeEnumArgument: 'The argument passed here does not have a shared enum type with the expected enum {{enumNames}}.',
            unsafeEnumAssertion: 'The value asserted here does not have a shared enum type with the expected enum {{enumNames}}.',
            unsafeEnumAssignment: 'The value assigned here does not have a shared enum type with the expected enum {{enumNames}}.',
            unsafeEnumMutation: 'This mutation can produce a value outside of the expected enum {{enumNames}}.',
            unsafeEnumReturn: 'The value returned here does not have a shared enum type with the expected enum {{enumNames}}.',
        },
        schema: [],
    },
    defaultOptions: [],
    create(context) {
        const services = (0, util_1.getParserServices)(context);
        const checker = services.program.getTypeChecker();
        const checkedNodes = new WeakSet();
        function report(node, messageId, receiverTypes) {
            context.report({
                node,
                messageId,
                data: { enumNames: describeEnumTypes(checker, receiverTypes) },
            });
        }
        // Literals inside an already reported value would otherwise be reported
        // again by their own handlers:
        //
        // ```ts
        // const value: T = [Fruit.Apple, 1] as const;
        // ```
        function markChecked(node) {
            checkedNodes.add(node);
            switch (node.type) {
                case utils_1.AST_NODE_TYPES.ArrayExpression:
                    node.elements.forEach(element => {
                        if (element) {
                            markChecked(element);
                        }
                    });
                    break;
                case utils_1.AST_NODE_TYPES.ConditionalExpression:
                    markChecked(node.consequent);
                    markChecked(node.alternate);
                    break;
                case utils_1.AST_NODE_TYPES.LogicalExpression:
                    markChecked(node.left);
                    markChecked(node.right);
                    break;
                case utils_1.AST_NODE_TYPES.ObjectExpression:
                    node.properties.forEach(markChecked);
                    break;
                case utils_1.AST_NODE_TYPES.Property:
                    markChecked(node.value);
                    break;
                case utils_1.AST_NODE_TYPES.SpreadElement:
                    markChecked(node.argument);
                    break;
                case utils_1.AST_NODE_TYPES.TSAsExpression:
                case utils_1.AST_NODE_TYPES.TSNonNullExpression:
                case utils_1.AST_NODE_TYPES.TSSatisfiesExpression:
                case utils_1.AST_NODE_TYPES.TSTypeAssertion:
                    markChecked(node.expression);
                    break;
            }
        }
        function getContextualType(node) {
            return checker.getContextualType(services.esTreeNodeToTSNodeMap.get(node));
        }
        // Bitwise combinations of an enum's own members are its bit flags:
        //
        // ```ts
        // const readWrite: Flags = Flags.Read | Flags.Write;
        // flags &= ~Flags.Write;
        // ```
        function isSafeEnumBitwiseExpression(node, receiverType) {
            function isSafeOperand(operand) {
                return (isSafeEnumBitwiseExpression(operand, receiverType) ||
                    !isMismatchedEnumAssignmentTypes(checker, services.getTypeAtLocation(operand), receiverType));
            }
            switch (node.type) {
                case utils_1.AST_NODE_TYPES.BinaryExpression:
                    return (bitwiseOperators.has(node.operator) &&
                        isSafeOperand(node.left) &&
                        isSafeOperand(node.right));
                case utils_1.AST_NODE_TYPES.UnaryExpression:
                    return node.operator === '~' && isSafeOperand(node.argument);
                default:
                    return false;
            }
        }
        function isUnsafeAssignment(senderNode, receiverType, senderType = services.getTypeAtLocation(senderNode)) {
            return (hasEnumAssignmentMismatch(checker, senderType, receiverType) &&
                !isSafeEnumBitwiseExpression(senderNode, receiverType));
        }
        function checkAssignment(receiverType, senderNode, reportingNode, messageId = 'unsafeEnumAssignment', senderType) {
            // Object and array literals are reported per property and element by
            // their own handlers instead:
            //
            // ```ts
            // const box: { fruit: Fruit } = { fruit: 1 };
            // ```
            if (senderNode.type === utils_1.AST_NODE_TYPES.ArrayExpression ||
                senderNode.type === utils_1.AST_NODE_TYPES.ObjectExpression ||
                !isUnsafeAssignment(senderNode, receiverType, senderType)) {
                return;
            }
            report(reportingNode, messageId, [receiverType]);
            markChecked(senderNode);
        }
        function checkArguments(node, args) {
            const signature = util_1.FunctionSignature.create(checker, services.esTreeNodeToTSNodeMap.get(node));
            if (node.type === utils_1.AST_NODE_TYPES.TaggedTemplateExpression) {
                // The first parameter receives the template's strings, not a value.
                signature.getNextParameterType();
            }
            for (const argument of args) {
                if (argument.type === utils_1.AST_NODE_TYPES.SpreadElement) {
                    const spreadType = services.getTypeAtLocation(argument.argument);
                    // takesFruits(...[Fruit.Apple, 1]);
                    if (checker.isTupleType(spreadType)) {
                        const mismatchedParameterTypes = checker
                            .getTypeArguments(spreadType)
                            .flatMap(elementType => {
                            const parameterType = signature.getNextParameterType();
                            return parameterType != null &&
                                hasEnumAssignmentMismatch(checker, elementType, parameterType)
                                ? [parameterType]
                                : [];
                        });
                        if (mismatchedParameterTypes.length > 0) {
                            report(argument, 'unsafeEnumArgument', mismatchedParameterTypes);
                        }
                        if (spreadType.target.combinedFlags & ts.ElementFlags.Variable) {
                            signature.consumeRemainingArguments();
                        }
                        continue;
                    }
                }
                // takesFruit(1);
                // takesFruits(...numbers);
                const parameterType = signature.getNextParameterType();
                if (parameterType != null) {
                    checkAssignment(parameterType, argument, argument, 'unsafeEnumArgument');
                }
            }
        }
        function checkClassMember(node) {
            // Class members don't get contextually typed by the members they
            // implement or override, so those types are also checked explicitly:
            //
            // ```ts
            // class Basket implements HasFruit {
            //   fruit = 1;
            // }
            // ```
            const heritageMemberTypes = getHeritageMemberTypes(node);
            if (heritageMemberTypes.length > 0 &&
                heritageMemberTypes.every(heritageMemberType => isUnsafeAssignment(node.value, heritageMemberType))) {
                report(node, 'unsafeEnumAssignment', heritageMemberTypes);
                markChecked(node.value);
                return;
            }
            checkAssignment(services.getTypeAtLocation(node), node.value, node);
        }
        function getHeritageMemberTypes(node) {
            const memberName = (0, util_1.getStaticMemberAccessValue)(node, context);
            if (typeof memberName !== 'string') {
                return [];
            }
            const classNode = services.esTreeNodeToTSNodeMap.get(node).parent;
            return (classNode.heritageClauses ?? []).flatMap(heritageClause => heritageClause.types.flatMap(heritageType => {
                const memberSymbol = checker
                    .getTypeAtLocation(heritageType)
                    .getProperty(memberName);
                return memberSymbol ? [checker.getTypeOfSymbol(memberSymbol)] : [];
            }));
        }
        function checkMutation(targetNode, reportingNode) {
            const targetType = services.getTypeAtLocation(targetNode);
            if ((0, shared_1.getEnumTypes)(checker, getConstraintType(checker, targetType)).length > 0) {
                report(reportingNode, 'unsafeEnumMutation', [targetType]);
            }
        }
        function checkReturn(returnNode, reportingNode) {
            const functionNode = (0, getParentFunctionNode_1.getParentFunctionNode)(returnNode);
            if (functionNode == null) {
                // return 1;
                return;
            }
            const signature = (0, util_1.nullThrows)(checker.getSignatureFromDeclaration(services.esTreeNodeToTSNodeMap.get(functionNode)), 'Expected the function to have a signature.');
            let receiverType = signature.getReturnType();
            let senderType = services.getTypeAtLocation(returnNode);
            // async function getFruit(): Promise<Fruit> {
            //   return Promise.resolve(1);
            // }
            if (functionNode.async) {
                receiverType = checker.getAwaitedType(receiverType);
                senderType = checker.getAwaitedType(senderType);
            }
            if (receiverType && senderType) {
                checkAssignment(receiverType, returnNode, reportingNode, 'unsafeEnumReturn', senderType);
            }
        }
        function checkTypeAssertion(node) {
            checkAssignment(services.getTypeAtLocation(node.typeAnnotation), node.expression, node, 'unsafeEnumAssertion');
        }
        return {
            'AccessorProperty[value != null], PropertyDefinition[value != null]': checkClassMember,
            ArrayExpression(node) {
                if (checkedNodes.has(node)) {
                    return;
                }
                // const fruits: Fruit[] = [1, ...numbers];
                for (const element of node.elements) {
                    if (element) {
                        const receiverType = getContextualType(element);
                        if (receiverType) {
                            checkAssignment(receiverType, element, element);
                        }
                    }
                }
            },
            'ArrowFunctionExpression[body.type != "BlockStatement"]'(node) {
                checkReturn(node.body, node.body);
            },
            AssignmentExpression(node) {
                if (assigningOperators.has(node.operator)) {
                    checkAssignment(services.getTypeAtLocation(node.left), node.right, node);
                }
                else {
                    checkMutation(node.left, node);
                }
            },
            AssignmentPattern(node) {
                checkAssignment(services.getTypeAtLocation(node.left), node.right, node);
            },
            'CallExpression, NewExpression'(node) {
                checkArguments(node, node.arguments);
            },
            'JSXAttribute > JSXExpressionContainer > :not(JSXEmptyExpression)'(node) {
                const receiverType = getContextualType(node);
                if (receiverType) {
                    checkAssignment(receiverType, node, node);
                }
            },
            'MemberExpression[computed = true]'(node) {
                const receiverTypes = checker
                    .getSymbolAtLocation(services.esTreeNodeToTSNodeMap.get(node).expression)
                    ?.declarations?.flatMap(declaration => getMappedKeyConstraintTypes(checker, declaration)) ?? [];
                if (receiverTypes.length === 0) {
                    return;
                }
                // declare const foo: { [key in Fruit]: string };
                // foo[0];
                const senderType = services.getTypeAtLocation(node.property);
                if (receiverTypes.every(receiverType => hasEnumAssignmentMismatch(checker, senderType, receiverType) ||
                    !checker.isTypeAssignableTo(senderType, receiverType))) {
                    report(node.property, 'unsafeEnumAccess', receiverTypes);
                }
            },
            ObjectExpression(node) {
                if (checkedNodes.has(node)) {
                    return;
                }
                // const box: { fruit: Fruit } = { fruit: 1, ...source };
                for (const property of node.properties) {
                    const [receiverNode, senderNode] = property.type === utils_1.AST_NODE_TYPES.SpreadElement
                        ? [node, property.argument]
                        : [property.value, property.value];
                    const receiverType = getContextualType(receiverNode);
                    if (receiverType) {
                        checkAssignment(receiverType, senderNode, property);
                    }
                }
            },
            ReturnStatement(node) {
                if (node.argument) {
                    checkReturn(node.argument, node);
                }
            },
            TaggedTemplateExpression(node) {
                checkArguments(node, node.quasi.expressions);
            },
            TSAsExpression: checkTypeAssertion,
            TSTypeAssertion: checkTypeAssertion,
            UpdateExpression(node) {
                checkMutation(node.argument, node);
            },
            'VariableDeclarator[init != null]'(node) {
                checkAssignment(services.getTypeAtLocation(node.id), node.init, node);
            },
        };
    },
});
function getConstraintType(checker, type) {
    return checker.getBaseConstraintOfType(type) ?? type;
}
function getTypeArguments(checker, type) {
    return tsutils.isTypeReference(type) ? checker.getTypeArguments(type) : [];
}
const genericTypes = new WeakMap();
function isGenericType(checker, type) {
    let generic = genericTypes.get(type);
    if (generic == null) {
        genericTypes.set(type, false);
        generic =
            tsutils.isTypeFlagSet(type, ts.TypeFlags.Instantiable) ||
                [
                    ...(tsutils.isUnionOrIntersectionType(type) ? type.types : []),
                    ...(type.aliasTypeArguments ?? []),
                    ...getTypeArguments(checker, type),
                ].some(part => isGenericType(checker, part));
        genericTypes.set(type, generic);
    }
    return generic;
}
const maximumDepth = 5;
const topLevelMismatches = new WeakMap();
function hasEnumAssignmentMismatch(checker, senderType, receiverType) {
    let receiverMismatches = topLevelMismatches.get(senderType);
    if (receiverMismatches == null) {
        receiverMismatches = new WeakMap();
        topLevelMismatches.set(senderType, receiverMismatches);
    }
    let mismatch = receiverMismatches.get(receiverType);
    if (mismatch == null) {
        mismatch = hasDeepEnumAssignmentMismatch(checker, senderType, receiverType);
        receiverMismatches.set(receiverType, mismatch);
    }
    return mismatch;
}
function hasDeepEnumAssignmentMismatch(checker, senderType, receiverType, visited = new WeakMap(), depth = 0, withinGenericMembers = false) {
    if (depth > maximumDepth) {
        return false;
    }
    const constrainedSenderType = getConstraintType(checker, senderType);
    const constrainedReceiverType = getConstraintType(checker, receiverType);
    if (constrainedSenderType === constrainedReceiverType) {
        return false;
    }
    // Recursive types would otherwise be visited endlessly.
    let visitedReceiverTypes = visited.get(constrainedSenderType);
    if (visitedReceiverTypes == null) {
        visitedReceiverTypes = new WeakSet();
        visited.set(constrainedSenderType, visitedReceiverTypes);
    }
    else if (visitedReceiverTypes.has(constrainedReceiverType)) {
        return false;
    }
    visitedReceiverTypes.add(constrainedReceiverType);
    if (isMismatchedEnumAssignmentTypes(checker, constrainedSenderType, constrainedReceiverType)) {
        return true;
    }
    // Set<number> -> Set<Fruit>
    const senderTypeArguments = getTypeArguments(checker, constrainedSenderType);
    const receiverTypeArguments = getTypeArguments(checker, constrainedReceiverType);
    if (senderTypeArguments.length === receiverTypeArguments.length &&
        senderTypeArguments.some((senderTypeArgument, index) => hasDeepEnumAssignmentMismatch(checker, senderTypeArgument, receiverTypeArguments[index], visited, depth + 1, withinGenericMembers))) {
        return true;
    }
    // Members of generic types can instantiate ever-larger generic types.
    const generic = isGenericType(checker, constrainedSenderType) ||
        isGenericType(checker, constrainedReceiverType);
    if (generic && withinGenericMembers) {
        return false;
    }
    // [number, Fruit] -> Fruit[]
    const senderElementType = constrainedSenderType.getNumberIndexType();
    const receiverElementType = constrainedReceiverType.getNumberIndexType();
    if (senderElementType &&
        receiverElementType &&
        hasDeepEnumAssignmentMismatch(checker, senderElementType, receiverElementType, visited, depth + 1, generic || withinGenericMembers)) {
        return true;
    }
    // { fruit: number } -> { fruit: Fruit }
    return constrainedReceiverType.getProperties().some(receiverProperty => {
        const senderProperty = constrainedSenderType.getProperty(receiverProperty.name);
        return (senderProperty != null &&
            hasDeepEnumAssignmentMismatch(checker, checker.getTypeOfSymbol(senderProperty), checker.getTypeOfSymbol(receiverProperty), visited, depth + 1, generic || withinGenericMembers));
    });
}
function getMappedKeyConstraintTypes(checker, declaration) {
    if (!(ts.isGetAccessorDeclaration(declaration) ||
        ts.isParameter(declaration) ||
        ts.isPropertyDeclaration(declaration) ||
        ts.isPropertySignature(declaration) ||
        ts.isVariableDeclaration(declaration)) ||
        declaration.type == null) {
        return [];
    }
    const typeNode = declaration.type;
    // { [key in Fruit]: string } -> [Fruit]
    if (ts.isMappedTypeNode(typeNode)) {
        return [
            checker.getTypeFromTypeNode((0, util_1.nullThrows)(typeNode.typeParameter.constraint, 'Expected the mapped type parameter to have a constraint.')),
        ];
    }
    // { [Fruit.Apple]: string; [Vegetable.Asparagus]: string } -> [Fruit.Apple, Vegetable.Asparagus]
    if (ts.isTypeLiteralNode(typeNode)) {
        return typeNode.members.flatMap(member => {
            const name = ts.getNameOfDeclaration(member);
            return name && ts.isComputedPropertyName(name)
                ? [checker.getTypeAtLocation(name.expression)]
                : [];
        });
    }
    return [];
}
// [Fruit, Set<Vegetable>] -> 'Fruit', 'Vegetable'
function describeEnumTypes(checker, types) {
    const enumNames = new Set();
    const visited = new Set();
    function visit(type) {
        const constrainedType = getConstraintType(checker, type);
        if (visited.has(constrainedType)) {
            return;
        }
        visited.add(constrainedType);
        for (const enumType of (0, shared_1.getEnumTypes)(checker, constrainedType)) {
            enumNames.add(checker.typeToString(enumType));
        }
        for (const typeArgument of getTypeArguments(checker, constrainedType)) {
            visit(typeArgument);
        }
        const elementType = constrainedType.getNumberIndexType();
        if (elementType) {
            visit(elementType);
        }
        for (const property of constrainedType.getProperties()) {
            visit(checker.getTypeOfSymbol(property));
        }
    }
    types.forEach(visit);
    return [...enumNames]
        .sort()
        .map(enumName => `'${enumName}'`)
        .join(', ');
}
function isMismatchedEnumAssignmentTypes(checker, senderType, receiverType) {
    const receiverEnumTypes = (0, shared_1.getEnumTypes)(checker, receiverType);
    const receiverTypeParts = tsutils.unionConstituents(receiverType);
    const receiverEnumValueTypes = new Set(receiverTypeParts.map(shared_1.getEnumValueType));
    const receiverNonEnumParts = receiverTypeParts.filter(receiverTypePart => (0, shared_1.getEnumTypes)(checker, receiverTypePart).length === 0);
    return tsutils.unionConstituents(senderType).some(senderTypePart => 
    // const fruit: Fruit = 1;
    ((receiverEnumValueTypes.has(ts.TypeFlags.Number) &&
        (0, util_1.isNumberLike)(senderTypePart)) ||
        (receiverEnumValueTypes.has(ts.TypeFlags.String) &&
            (0, util_1.isStringLike)(senderTypePart))) &&
        // const fruit: Fruit = Fruit.Apple;
        !hasSharedEnumType(checker, senderTypePart, receiverEnumTypes) &&
        // const fruitOrNumber: Fruit | number = 1;
        !receiverNonEnumParts.some(receiverTypePart => checker.isTypeAssignableTo(senderTypePart, receiverTypePart)));
}
function hasSharedEnumType(checker, type, expectedEnumTypes) {
    const typeEnumTypes = new Set((0, shared_1.getEnumTypes)(checker, type));
    return expectedEnumTypes.some(expectedEnumType => typeEnumTypes.has(expectedEnumType));
}
//# sourceMappingURL=no-unsafe-enum-assignment.js.map