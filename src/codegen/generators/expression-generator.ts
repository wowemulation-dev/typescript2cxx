/**
 * Expression generation utilities for C++ code generation
 */

import type {
  IRArrayExpression,
  IRAssignmentExpression,
  IRAwaitExpression,
  IRBinaryExpression,
  IRCallExpression,
  IRConditionalExpression,
  IRExpression,
  IRIdentifier,
  IRLiteral,
  IRMemberExpression,
  IRNewExpression,
  IRObjectExpression,
  IROptionalChainingExpression,
  IRSpreadElement,
  IRTemplateLiteral,
  IRThisExpression,
  IRUnaryExpression,
  IRFunctionExpression,
} from "../../ir/nodes.ts";
import { IRNodeKind } from "../../ir/nodes.ts";
import type { CodeGenContext } from "../context.ts";
import type { TypeMapper } from "./type-mapper.ts";

export class ExpressionGenerator {
  private tempVarCounter = 0;

  constructor(private typeMapper: TypeMapper) {}

  generateExpression(expr: IRExpression, context: CodeGenContext): string {
    switch (expr.kind) {
      case IRNodeKind.Identifier:
        return this.generateIdentifier(expr, context);
      case IRNodeKind.Literal:
        return this.generateLiteral(expr, context);
      case IRNodeKind.BinaryExpression:
        return this.generateBinary(expr, context);
      case IRNodeKind.UnaryExpression:
        return this.generateUnary(expr, context);
      case IRNodeKind.CallExpression:
        return this.generateCall(expr, context);
      case IRNodeKind.MemberExpression:
        return this.generateMember(expr, context);
      case IRNodeKind.OptionalChainingExpression:
        return this.generateOptionalChaining(expr, context);
      case IRNodeKind.AssignmentExpression:
        return this.generateAssignment(expr, context);
      case IRNodeKind.FunctionExpression:
      case IRNodeKind.ArrowFunctionExpression:
        return this.generateLambda(expr as IRFunctionExpression, context);
      case IRNodeKind.TemplateLiteral:
        return this.generateTemplateLiteral(expr, context);
      case IRNodeKind.ArrayExpression:
        return this.generateArray(expr, context);
      case IRNodeKind.ObjectExpression:
        return this.generateObject(expr, context);
      case IRNodeKind.ConditionalExpression:
        return this.generateConditional(expr, context);
      case IRNodeKind.NewExpression:
        return this.generateNew(expr, context);
      case IRNodeKind.ThisExpression:
        return this.generateThis(expr, context);
      case IRNodeKind.AwaitExpression:
        return this.generateAwait(expr, context);
      case IRNodeKind.SpreadElement:
        return this.generateSpread(expr, context);
      case IRNodeKind.UpdateExpression:
        return this.generateUpdate(expr, context);
      case IRNodeKind.LogicalExpression:
        return this.generateLogical(expr, context);
      case IRNodeKind.SequenceExpression:
        return this.generateSequence(expr, context);
      case IRNodeKind.YieldExpression:
        return this.generateYield(expr, context);
      case IRNodeKind.ClassExpression:
        // Class expressions are not directly supported in C++
        return "/* class expression */";
      case IRNodeKind.SuperExpression:
        return "/* super */";
      case IRNodeKind.TaggedTemplateExpression:
        return this.generateTaggedTemplate(expr, context);
      default:
        context.errorReporter?.reportWarning({
          message: `Unsupported expression kind: ${expr.kind}`,
          location: expr.location,
        });
        return "/* unsupported expression */";
    }
  }

  generateIdentifier(id: IRIdentifier, context: CodeGenContext): string {
    // Check for global JavaScript objects
    const globalMappings: Record<string, string> = {
      "console": "js::console",
      "Math": "js::Math",
      "Date": "js::Date",
      "JSON": "js::JSON",
      "Object": "js::Object",
      "Array": "js::Array",
      "String": "js::String",
      "Number": "js::Number",
      "Boolean": "js::Boolean",
      "undefined": "js::undefined",
      "null": "nullptr",
      "NaN": "js::number::NaN",
      "Infinity": "js::number::Infinity",
      "globalThis": "js::globalThis",
      "window": "js::window",
      "document": "js::document",
      "Promise": "js::Promise",
      "RegExp": "js::RegExp",
      "Error": "js::Error",
      "TypeError": "js::TypeError",
      "ReferenceError": "js::ReferenceError",
      "SyntaxError": "js::SyntaxError",
      "RangeError": "js::RangeError",
      "parseInt": "js::parseInt",
      "parseFloat": "js::parseFloat",
      "isNaN": "js::isNaN",
      "isFinite": "js::isFinite",
      "encodeURI": "js::encodeURI",
      "decodeURI": "js::decodeURI",
      "encodeURIComponent": "js::encodeURIComponent",
      "decodeURIComponent": "js::decodeURIComponent",
      "Int8Array": "js::Int8Array",
      "Uint8Array": "js::Uint8Array",
      "Uint8ClampedArray": "js::Uint8ClampedArray",
      "Int16Array": "js::Int16Array",
      "Uint16Array": "js::Uint16Array",
      "Int32Array": "js::Int32Array",
      "Uint32Array": "js::Uint32Array",
      "Float32Array": "js::Float32Array",
      "Float64Array": "js::Float64Array",
      "BigInt64Array": "js::BigInt64Array",
      "BigUint64Array": "js::BigUint64Array",
    };

    if (globalMappings[id.name]) {
      return globalMappings[id.name];
    }

    // Handle C++ reserved keywords
    const reserved = new Set([
      "auto", "break", "case", "char", "const", "continue", "default", "do",
      "double", "else", "enum", "extern", "float", "for", "goto", "if",
      "int", "long", "register", "return", "short", "signed", "sizeof", "static",
      "struct", "switch", "typedef", "union", "unsigned", "void", "volatile", "while",
      "class", "private", "protected", "public", "virtual", "explicit", "friend",
      "inline", "namespace", "new", "delete", "operator", "template", "this",
      "throw", "try", "catch", "typename", "using", "bool", "true", "false",
      "and", "or", "not", "xor", "and_eq", "or_eq", "not_eq", "xor_eq",
      "bitand", "bitor", "compl", "nullptr", "decltype", "constexpr", "noexcept",
      "static_assert", "thread_local", "alignas", "alignof", "char16_t", "char32_t"
    ]);

    if (reserved.has(id.name)) {
      return `${id.name}_`;
    }

    return id.name;
  }

  generateLiteral(lit: IRLiteral, _context: CodeGenContext): string {
    switch (lit.literalType) {
      case "string":
        // Escape special characters and use js::string literal
        const escaped = String(lit.value)
          .replace(/\\/g, "\\\\")
          .replace(/"/g, '\\"')
          .replace(/\n/g, "\\n")
          .replace(/\r/g, "\\r")
          .replace(/\t/g, "\\t");
        return `"${escaped}"_S`;
      case "number":
        // Handle special numeric values
        if (lit.raw === "NaN") return "js::number::NaN";
        if (lit.raw === "Infinity") return "js::number::Infinity";
        if (lit.raw === "-Infinity") return "-js::number::Infinity";
        
        // Remove numeric separators
        const cleanNumber = lit.raw?.replace(/_/g, "") || String(lit.value);
        return cleanNumber;
      case "boolean":
        return String(lit.value);
      case "null":
        return "nullptr";
      case "undefined":
        return "js::undefined";
      case "regex":
        // Generate regex literal
        const pattern = lit.pattern || "";
        const flags = lit.flags || "";
        return `js::RegExp("${pattern}", "${flags}")`;
      case "bigint":
        // C++ doesn't have native bigint, use string representation
        return `js::BigInt("${lit.value}")`;
      default:
        return String(lit.value);
    }
  }

  generateBinary(expr: IRBinaryExpression, context: CodeGenContext): string {
    const left = this.generateExpression(expr.left, context);
    const right = this.generateExpression(expr.right, context);

    // Map JavaScript operators to C++
    const operatorMap: Record<string, string> = {
      "===": "==",
      "!==": "!=",
      "**": "std::pow",
      "in": "js::in_operator",
      "instanceof": "js::instanceof",
    };

    let op = operatorMap[expr.operator] || expr.operator;

    // Handle special operators
    if (expr.operator === "**") {
      // Exponentiation requires std::pow
      context.requiredIncludes?.add("cmath");
      return `std::pow(${left}, ${right})`;
    } else if (expr.operator === "in") {
      return `js::in_operator(${left}, ${right})`;
    } else if (expr.operator === "instanceof") {
      return `js::instanceof(${left}, ${right})`;
    }

    return `(${left} ${op} ${right})`;
  }

  generateUnary(expr: IRUnaryExpression, context: CodeGenContext): string {
    const argument = this.generateExpression(expr.argument, context);

    switch (expr.operator) {
      case "typeof":
        return `js::typeof_operator(${argument})`;
      case "delete":
        return `js::delete_operator(${argument})`;
      case "void":
        return `(void(${argument}), js::undefined)`;
      case "!":
        return `!${argument}`;
      case "+":
        return `+${argument}`;
      case "-":
        return `-${argument}`;
      case "~":
        return `~${argument}`;
      case "++":
        if (expr.prefix) {
          return `++${argument}`;
        } else {
          return `${argument}++`;
        }
      case "--":
        if (expr.prefix) {
          return `--${argument}`;
        } else {
          return `${argument}--`;
        }
      default:
        return `/* ${expr.operator} */ ${argument}`;
    }
  }

  generateCall(expr: IRCallExpression, context: CodeGenContext): string {
    let callee = this.generateExpression(expr.callee, context);
    const args = expr.arguments.map(arg => {
      if (arg.kind === IRNodeKind.SpreadElement) {
        // Handle spread in function calls
        const spreadExpr = this.generateExpression(arg.expression, context);
        return `/* ...${spreadExpr} */`;
      }
      return this.generateExpression(arg, context);
    });

    // Handle IIFE pattern
    if (expr.callee.kind === IRNodeKind.FunctionExpression || 
        expr.callee.kind === IRNodeKind.ArrowFunctionExpression) {
      return `${callee}(${args.join(", ")})`;
    }

    return `${callee}(${args.join(", ")})`;
  }

  generateMember(expr: IRMemberExpression, context: CodeGenContext): string {
    const object = this.generateExpression(expr.object, context);
    
    // Handle static methods on built-in objects
    const staticMethods: Record<string, Set<string>> = {
      "js::Math": new Set(["PI", "E", "abs", "max", "min", "random", "sin", "cos", "tan", 
                          "sqrt", "pow", "floor", "ceil", "round"]),
      "js::Date": new Set(["now"]),
      "js::JSON": new Set(["stringify", "parse"]),
      "js::Object": new Set(["keys", "values", "entries", "fromEntries", "assign", "create"]),
      "js::Array": new Set(["isArray", "from", "of"]),
      "js::Number": new Set(["isNaN", "isFinite", "parseInt", "parseFloat"]),
    };

    // Check if this is a static method access
    for (const [objName, methods] of Object.entries(staticMethods)) {
      if (object === objName && expr.property.kind === IRNodeKind.Identifier) {
        const propName = expr.property.name;
        if (methods.has(propName)) {
          return `${object}::${propName}`;
        }
      }
    }

    // Handle computed member access
    if (expr.computed) {
      const property = this.generateExpression(expr.property, context);
      return `${object}[${property}]`;
    }

    // Handle regular property access
    if (expr.property.kind === IRNodeKind.Identifier) {
      const propName = expr.property.name;
      
      // Check for array methods
      const arrayMethods = ["push", "pop", "shift", "unshift", "slice", "splice", 
                           "indexOf", "includes", "find", "findIndex", "map", "filter",
                           "reduce", "forEach", "some", "every", "join", "reverse", 
                           "sort", "length", "concat"];
      
      if (arrayMethods.includes(propName)) {
        return `${object}.${propName}`;
      }

      // Check for string methods
      const stringMethods = ["length", "charAt", "charCodeAt", "slice", "substring",
                            "substr", "indexOf", "lastIndexOf", "split", "replace",
                            "toUpperCase", "toLowerCase", "trim", "trimStart", "trimEnd",
                            "padStart", "padEnd", "includes", "startsWith", "endsWith",
                            "repeat", "concat"];
      
      if (stringMethods.includes(propName)) {
        return `${object}.${propName}`;
      }

      // Default property access
      return `${object}.${propName}`;
    }

    return `${object}.${this.generateExpression(expr.property, context)}`;
  }

  generateOptionalChaining(
    expr: IROptionalChainingExpression,
    context: CodeGenContext,
  ): string {
    const object = this.generateExpression(expr.object, context);
    
    if (expr.computed) {
      const property = this.generateExpression(expr.property, context);
      return `js::optional_chain(${object}, [](auto& obj) { return obj[${property}]; })`;
    } else if (expr.property.kind === IRNodeKind.Identifier) {
      const propName = expr.property.name;
      return `js::optional_chain(${object}, [](auto& obj) { return obj.${propName}; })`;
    }

    return `js::optional_chain(${object}, [](auto& obj) { return obj.${this.generateExpression(expr.property, context)}; })`;
  }

  generateAssignment(expr: IRAssignmentExpression, context: CodeGenContext): string {
    const left = this.generateExpression(expr.left, context);
    const right = this.generateExpression(expr.right, context);

    if (expr.operator === "=") {
      return `${left} = ${right}`;
    }

    // Compound assignment operators
    const op = expr.operator.slice(0, -1); // Remove the '=' at the end
    return `${left} ${expr.operator} ${right}`;
  }

  generateLambda(expr: IRFunctionExpression, context: CodeGenContext): string {
    const params = expr.params.map(p => {
      const type = p.type ? this.typeMapper.mapType(p.type) : "auto";
      return `${type} ${p.name}`;
    }).join(", ");

    const returnType = expr.returnType ? this.typeMapper.mapType(expr.returnType) : "auto";
    
    // Generate lambda capture
    let capture = "[=]"; // Capture by value by default
    if (expr.isAsync) {
      capture = "[=]() mutable"; // Async lambdas need mutable
    }

    const lines: string[] = [];
    lines.push(`${capture}(${params}) -> ${returnType} {`);

    // Generate body
    if (expr.body.kind === IRNodeKind.BlockStatement) {
      const bodyContext = { ...context, indentLevel: context.indentLevel + 1 };
      for (const stmt of expr.body.body) {
        const code = this.generateStatement(stmt, bodyContext);
        if (code) {
          lines.push(code);
        }
      }
    } else {
      // Arrow function with expression body
      const bodyContext = { ...context, indentLevel: context.indentLevel + 1 };
      const indent = "  ".repeat(bodyContext.indentLevel);
      const bodyExpr = this.generateExpression(expr.body, bodyContext);
      lines.push(`${indent}return ${bodyExpr};`);
    }

    lines.push("}");

    return lines.join("\n");
  }

  generateTemplateLiteral(expr: IRTemplateLiteral, context: CodeGenContext): string {
    let result = 'js::string("")';
    
    for (let i = 0; i < expr.quasis.length; i++) {
      const quasi = expr.quasis[i];
      const text = quasi.value.cooked || quasi.value.raw;
      
      if (text) {
        result = `${result} + "${text}"_S`;
      }
      
      if (i < expr.expressions.length) {
        const exprStr = this.generateExpression(expr.expressions[i], context);
        result = `${result} + js::to_string(${exprStr})`;
      }
    }

    return `(${result})`;
  }

  generateArray(expr: IRArrayExpression, context: CodeGenContext): string {
    const elements = expr.elements.map(el => {
      if (!el) {
        return "js::undefined";
      }
      if (el.kind === IRNodeKind.SpreadElement) {
        // Handle spread in array literals
        const spreadExpr = this.generateExpression(el.expression, context);
        return `/* ...${spreadExpr} */`;
      }
      return this.generateExpression(el, context);
    });

    // Determine array type
    let arrayType = "js::array<js::any>";
    if (expr.typeAnnotation) {
      arrayType = this.typeMapper.mapType(expr.typeAnnotation);
    }

    if (elements.length === 0) {
      return `${arrayType}{}`;
    }

    return `${arrayType}{${elements.join(", ")}}`;
  }

  generateObject(expr: IRObjectExpression, context: CodeGenContext): string {
    const properties = expr.properties.map(prop => {
      if (prop.kind === IRNodeKind.SpreadElement) {
        // Handle object spread
        const spreadExpr = this.generateExpression(prop.expression, context);
        return `/* ...${spreadExpr} */`;
      }

      let key: string;
      if (prop.computed) {
        key = `[${this.generateExpression(prop.key, context)}]`;
      } else if (prop.key.kind === IRNodeKind.Identifier) {
        key = `"${prop.key.name}"`;
      } else {
        key = this.generateExpression(prop.key, context);
      }

      const value = this.generateExpression(prop.value, context);
      return `{${key}, ${value}}`;
    });

    if (properties.length === 0) {
      return "js::object{}";
    }

    return `js::object{${properties.join(", ")}}`;
  }

  generateConditional(expr: IRConditionalExpression, context: CodeGenContext): string {
    const test = this.generateExpression(expr.test, context);
    const consequent = this.generateExpression(expr.consequent, context);
    const alternate = this.generateExpression(expr.alternate, context);
    return `(${test} ? ${consequent} : ${alternate})`;
  }

  generateNew(expr: IRNewExpression, context: CodeGenContext): string {
    const callee = this.generateExpression(expr.callee, context);
    const args = expr.arguments.map(arg => this.generateExpression(arg, context));

    // Check for built-in constructors
    if (expr.callee.kind === IRNodeKind.Identifier) {
      const name = expr.callee.name;
      if (name === "Error" || name === "TypeError" || name === "ReferenceError" ||
          name === "SyntaxError" || name === "RangeError") {
        return `js::${name}(${args.join(", ")})`;
      }
      if (name === "Date") {
        return `js::Date(${args.join(", ")})`;
      }
      if (name === "RegExp") {
        return `js::RegExp(${args.join(", ")})`;
      }
      if (name === "Promise") {
        return `js::Promise<js::any>(${args.join(", ")})`;
      }
    }

    // Default to std::make_shared for user classes
    return `std::make_shared<${callee}>(${args.join(", ")})`;
  }

  generateThis(expr: IRThisExpression, _context: CodeGenContext): string {
    return "this";
  }

  generateAwait(expr: IRAwaitExpression, context: CodeGenContext): string {
    const argument = this.generateExpression(expr.argument, context);
    return `co_await ${argument}`;
  }

  generateSpread(expr: IRSpreadElement, context: CodeGenContext): string {
    const argument = this.generateExpression(expr.expression, context);
    return `/* spread: ${argument} */`;
  }

  generateUpdate(expr: any, context: CodeGenContext): string {
    const argument = this.generateExpression(expr.argument, context);
    if (expr.prefix) {
      return `${expr.operator}${argument}`;
    } else {
      return `${argument}${expr.operator}`;
    }
  }

  generateLogical(expr: any, context: CodeGenContext): string {
    const left = this.generateExpression(expr.left, context);
    const right = this.generateExpression(expr.right, context);
    return `(${left} ${expr.operator} ${right})`;
  }

  generateSequence(expr: any, context: CodeGenContext): string {
    const expressions = expr.expressions.map((e: any) => 
      this.generateExpression(e, context)
    );
    return `(${expressions.join(", ")})`;
  }

  generateYield(expr: any, context: CodeGenContext): string {
    const argument = expr.argument ? 
      this.generateExpression(expr.argument, context) : "js::undefined";
    return `co_yield ${argument}`;
  }

  generateTaggedTemplate(expr: any, context: CodeGenContext): string {
    const tag = this.generateExpression(expr.tag, context);
    const template = this.generateTemplateLiteral(expr.quasi, context);
    return `${tag}(${template})`;
  }

  generateTempVar(): string {
    return `__tmp${this.tempVarCounter++}`;
  }

  setStatementGenerator(stmtGen: any): void {
    this.generateStatement = stmtGen;
  }

  private generateStatement: ((stmt: any, context: CodeGenContext) => string) = () => "";
}