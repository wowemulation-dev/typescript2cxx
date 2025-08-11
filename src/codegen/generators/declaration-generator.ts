/**
 * Declaration generation utilities for C++ code generation
 */

import type {
  IRClassDeclaration,
  IRClassMember,
  IREnumDeclaration,
  IRFunctionDeclaration,
  IRInterfaceDeclaration,
  IRMethodDefinition,
  IRNamespaceDeclaration,
  IRParameter,
  IRPropertyDefinition,
  IRVariableDeclaration,
  IRVariableDeclarator,
} from "../../ir/nodes.ts";
import { AccessModifier, IRNodeKind, MemoryManagement, VariableKind } from "../../ir/nodes.ts";
import type { CodeGenContext } from "../context.ts";
import type { ExpressionGenerator } from "./expression-generator.ts";
import type { StatementGenerator } from "./statement-generator.ts";
import type { TypeMapper } from "./type-mapper.ts";

export class DeclarationGenerator {
  constructor(
    private expressionGen: ExpressionGenerator,
    private typeMapper: TypeMapper,
  ) {}

  generateFunction(func: IRFunctionDeclaration, context: CodeGenContext): string {
    const indent = this.getIndent(context);
    const lines: string[] = [];

    // Handle decorators
    if (func.decorators && func.decorators.length > 0) {
      for (const decorator of func.decorators) {
        lines.push(`${indent}// @${decorator.name}`);
      }
    } else if (func.decorators && typeof func.decorators === "object") {
      // Handle decorator metadata
      const metadata = func.decorators;
      if (metadata.decorators && metadata.decorators.length > 0) {
        for (const decorator of metadata.decorators) {
          lines.push(`${indent}// @${decorator.name}`);
        }
      }
    }

    // Function signature
    let signature = "";
    
    // Add template parameters if any
    if (func.templateParams && func.templateParams.length > 0) {
      const templateParams = func.templateParams.map(param => {
        let paramStr = `typename ${param.name}`;
        if (param.constraint) {
          paramStr += ` = ${this.typeMapper.mapType(param.constraint)}`;
        }
        if (param.isConst) {
          paramStr = `/* const */ ${paramStr}`;
        }
        return paramStr;
      }).join(", ");
      lines.push(`${indent}template<${templateParams}>`);
    }

    // Add export/inline modifiers
    if (func.isExported && context.inHeader) {
      signature = "inline ";
    }

    // Add async modifier (coroutine)
    if (func.isAsync) {
      signature += "js::Promise<";
    }

    // Return type
    const returnType = func.returnType ? this.typeMapper.mapType(func.returnType) : "void";
    if (func.isAsync) {
      signature += `${returnType}> `;
    } else {
      signature += `${returnType} `;
    }

    // Function name
    signature += func.name;

    // Parameters
    signature += this.generateParameters(func.params, context);

    // Add const modifier if needed
    if (func.isConst) {
      signature += " const";
    }

    // For header files, just add declaration
    if (context.inHeader && !func.isExported) {
      lines.push(`${indent}${signature};`);
      return lines.join("\n");
    }

    // Generate function body
    lines.push(`${indent}${signature} {`);

    // Generate body statements
    if (func.body) {
      const bodyContext = { ...context, indentLevel: context.indentLevel + 1 };
      const stmtGen = context.statementGenerator;
      if (stmtGen) {
        for (const stmt of func.body.body) {
          const code = stmtGen.generateStatement(stmt, bodyContext);
          if (code) {
            lines.push(code);
          }
        }
      }
    }

    lines.push(`${indent}}`);

    return lines.join("\n");
  }

  generateClass(cls: IRClassDeclaration, context: CodeGenContext): string {
    const indent = this.getIndent(context);
    const lines: string[] = [];

    // Handle decorators
    if (cls.decorators && cls.decorators.length > 0) {
      for (const decorator of cls.decorators) {
        lines.push(`${indent}// @${decorator.name}`);
      }
      // Add metadata template specialization
      lines.push(`${indent}template<>`);
      lines.push(`${indent}struct has_metadata<${cls.name}> : std::true_type {};`);
      lines.push("");
    } else if (cls.decorators && typeof cls.decorators === "object") {
      const metadata = cls.decorators;
      if (metadata.decorators && metadata.decorators.length > 0) {
        for (const decorator of metadata.decorators) {
          lines.push(`${indent}// @${decorator.name}`);
        }
        lines.push(`${indent}template<>`);
        lines.push(`${indent}struct has_metadata<${cls.name}> : std::true_type {};`);
        lines.push("");
      }
    }

    // Class declaration
    let classDecl = `${indent}class ${cls.name}`;

    // Add base class
    if (cls.superClass) {
      classDecl += ` : public ${cls.superClass}`;
    }

    lines.push(`${classDecl} {`);

    // Group members by access level
    const publicMembers: IRClassMember[] = [];
    const privateMembers: IRClassMember[] = [];
    const protectedMembers: IRClassMember[] = [];

    for (const member of cls.members) {
      if (member.kind === IRNodeKind.PropertyDefinition || 
          member.kind === IRNodeKind.MethodDefinition) {
        switch (member.access) {
          case AccessModifier.Public:
            publicMembers.push(member);
            break;
          case AccessModifier.Private:
            privateMembers.push(member);
            break;
          case AccessModifier.Protected:
            protectedMembers.push(member);
            break;
        }
      }
    }

    // Generate public members
    if (publicMembers.length > 0) {
      lines.push(`${indent}public:`);
      for (const member of publicMembers) {
        const code = this.generateClassMember(member, { ...context, indentLevel: context.indentLevel + 1 });
        if (code) {
          lines.push(code);
        }
      }
    }

    // Generate protected members
    if (protectedMembers.length > 0) {
      lines.push(`${indent}protected:`);
      for (const member of protectedMembers) {
        const code = this.generateClassMember(member, { ...context, indentLevel: context.indentLevel + 1 });
        if (code) {
          lines.push(code);
        }
      }
    }

    // Generate private members
    if (privateMembers.length > 0) {
      lines.push(`${indent}private:`);
      for (const member of privateMembers) {
        const code = this.generateClassMember(member, { ...context, indentLevel: context.indentLevel + 1 });
        if (code) {
          lines.push(code);
        }
      }
    }

    lines.push(`${indent}};`);

    return lines.join("\n");
  }

  private generateClassMember(
    member: IRClassMember,
    context: CodeGenContext,
  ): string {
    const indent = this.getIndent(context);

    if (member.kind === IRNodeKind.PropertyDefinition) {
      return this.generatePropertyDefinition(member, context);
    } else if (member.kind === IRNodeKind.MethodDefinition) {
      return this.generateMethodDefinition(member, context);
    }

    return "";
  }

  private generatePropertyDefinition(prop: IRPropertyDefinition, context: CodeGenContext): string {
    const indent = this.getIndent(context);
    let type = prop.type ? this.typeMapper.mapType(prop.type) : "js::any";

    // Apply memory management
    type = this.applyMemoryManagement(type, prop.memory);

    let declaration = `${indent}${type} ${prop.name}`;

    // Add initializer if present
    if (prop.initializer) {
      const initValue = this.expressionGen.generateExpression(prop.initializer, context);
      declaration += ` = ${initValue}`;
    }

    declaration += ";";

    // Add comment for decorators
    if (prop.decorators && prop.decorators.length > 0) {
      const decoratorNames = prop.decorators.map(d => d.name).join(", ");
      declaration += ` // @${decoratorNames}`;
    }

    return declaration;
  }

  private generateMethodDefinition(method: IRMethodDefinition, context: CodeGenContext): string {
    const indent = this.getIndent(context);
    const lines: string[] = [];

    // Handle decorators
    if (method.decorators && method.decorators.length > 0) {
      for (const decorator of method.decorators) {
        lines.push(`${indent}// @${decorator.name}`);
      }
    }

    // Method signature
    let signature = "";

    // Add static modifier
    if (method.isStatic) {
      signature += "static ";
    }

    // Add virtual modifier
    if (method.isVirtual) {
      signature += "virtual ";
    }

    // Add async modifier (coroutine)
    if (method.isAsync) {
      signature += "js::Promise<";
    }

    // Return type (constructors don't have return type)
    if (!method.isConstructor) {
      const returnType = method.returnType ? this.typeMapper.mapType(method.returnType) : "void";
      if (method.isAsync) {
        signature += `${returnType}> `;
      } else {
        signature += `${returnType} `;
      }
    }

    // Method name
    if (method.isConstructor) {
      // Constructor uses class name (should be provided in context)
      signature += context.className || "ClassName";
    } else {
      signature += method.name;
    }

    // Parameters
    signature += this.generateParameters(method.params, context);

    // Add const modifier
    if (method.isConst && !method.isConstructor && !method.isStatic) {
      signature += " const";
    }

    // Add override modifier
    if (method.isOverride) {
      signature += " override";
    }

    // For header files, just add declaration
    if (context.inHeader) {
      lines.push(`${indent}${signature};`);
      return lines.join("\n");
    }

    // Generate method body
    lines.push(`${indent}${signature} {`);

    // Generate body statements
    if (method.body) {
      const bodyContext = { ...context, indentLevel: context.indentLevel + 1 };
      const stmtGen = context.statementGenerator;
      if (stmtGen) {
        for (const stmt of method.body.body) {
          const code = stmtGen.generateStatement(stmt, bodyContext);
          if (code) {
            lines.push(code);
          }
        }
      }
    }

    lines.push(`${indent}}`);

    return lines.join("\n");
  }

  generateInterface(iface: IRInterfaceDeclaration, context: CodeGenContext): string {
    const indent = this.getIndent(context);
    const lines: string[] = [];

    // In C++, interfaces are represented as abstract classes with pure virtual methods
    lines.push(`${indent}// Interface: ${iface.name}`);
    lines.push(`${indent}class ${iface.name} {`);
    lines.push(`${indent}public:`);

    // Generate pure virtual methods for interface members
    // Note: This is a simplified version. Full implementation would need to handle properties and methods
    lines.push(`${indent}  // Interface members would be declared here as pure virtual methods`);

    lines.push(`${indent}};`);

    return lines.join("\n");
  }

  generateEnum(enumDecl: IREnumDeclaration, context: CodeGenContext): string {
    const indent = this.getIndent(context);
    const lines: string[] = [];

    // Check if enum has string values
    const hasStringValues = enumDecl.members.some(m => 
      m.initializer && m.initializer.kind === IRNodeKind.Literal && 
      m.initializer.literalType === "string"
    );

    if (hasStringValues) {
      // Generate a namespace with constants for string enums
      lines.push(`${indent}namespace ${enumDecl.name} {`);
      
      for (const member of enumDecl.members) {
        const memberIndent = this.getIndent({ ...context, indentLevel: context.indentLevel + 1 });
        if (member.initializer) {
          const value = this.expressionGen.generateExpression(member.initializer, context);
          lines.push(`${memberIndent}const auto ${member.name} = ${value};`);
        } else {
          // Auto-increment for numeric enums
          lines.push(`${memberIndent}const auto ${member.name} = ${member.name};`);
        }
      }
      
      lines.push(`${indent}}`);
    } else {
      // Generate a regular C++ enum class for numeric enums
      lines.push(`${indent}enum class ${enumDecl.name} {`);
      
      for (let i = 0; i < enumDecl.members.length; i++) {
        const member = enumDecl.members[i];
        const memberIndent = this.getIndent({ ...context, indentLevel: context.indentLevel + 1 });
        let memberLine = `${memberIndent}${member.name}`;
        
        if (member.initializer) {
          const value = this.expressionGen.generateExpression(member.initializer, context);
          memberLine += ` = ${value}`;
        }
        
        if (i < enumDecl.members.length - 1) {
          memberLine += ",";
        }
        
        lines.push(memberLine);
      }
      
      lines.push(`${indent}};`);
    }

    return lines.join("\n");
  }

  generateVariable(varDecl: IRVariableDeclaration, context: CodeGenContext): string {
    const indent = this.getIndent(context);
    const lines: string[] = [];

    for (const decl of varDecl.declarations) {
      let line = indent;

      // Add const for const/let in certain contexts
      if (varDecl.kind === VariableKind.Const) {
        line += "const ";
      }

      // Determine type
      let type = "auto";
      if (decl.type) {
        type = this.typeMapper.mapType(decl.type);
      }

      // Apply memory management
      type = this.applyMemoryManagement(type, decl.memory || MemoryManagement.Auto);

      // Handle patterns
      if (decl.id.kind === IRNodeKind.ObjectPattern) {
        // Object destructuring
        const tempVar = this.expressionGen.generateTempVar();
        const initValue = decl.init ? this.expressionGen.generateExpression(decl.init, context) : "js::object{}";
        lines.push(`${indent}auto ${tempVar} = ${initValue};`);
        
        // Generate destructuring assignments
        for (const prop of decl.id.properties) {
          const propName = prop.key.name;
          const varName = prop.value.kind === IRNodeKind.Identifier ? prop.value.name : propName;
          lines.push(`${indent}auto ${varName} = ${tempVar}["${propName}"];`);
        }
      } else if (decl.id.kind === IRNodeKind.ArrayPattern) {
        // Array destructuring
        const tempVar = this.expressionGen.generateTempVar();
        const initValue = decl.init ? this.expressionGen.generateExpression(decl.init, context) : "js::array<js::any>{}";
        lines.push(`${indent}auto ${tempVar} = ${initValue};`);
        
        // Generate destructuring assignments
        for (let i = 0; i < decl.id.elements.length; i++) {
          const element = decl.id.elements[i];
          if (element) {
            if (element.kind === IRNodeKind.RestElement) {
              // Rest element - get remaining elements
              const varName = element.argument.name;
              lines.push(`${indent}auto ${varName} = ${tempVar}.slice(${i});`);
              break;
            } else if (element.kind === IRNodeKind.Identifier) {
              lines.push(`${indent}auto ${element.name} = ${tempVar}[${i}];`);
            }
          }
        }
      } else {
        // Regular variable declaration
        const varName = decl.id.name;
        line += `${type} ${varName}`;

        // Add initializer
        if (decl.init) {
          const initValue = this.expressionGen.generateExpression(decl.init, context);
          line += ` = ${initValue}`;
        }

        if (!context.noSemicolon) {
          line += ";";
        }

        lines.push(line);
      }
    }

    return lines.join("\n");
  }

  generateNamespace(ns: IRNamespaceDeclaration, context: CodeGenContext): string {
    const indent = this.getIndent(context);
    const lines: string[] = [];

    lines.push(`${indent}namespace ${ns.name} {`);

    const bodyContext = { ...context, indentLevel: context.indentLevel + 1 };
    const stmtGen = context.statementGenerator;
    if (stmtGen && ns.body) {
      for (const stmt of ns.body.body) {
        const code = stmtGen.generateStatement(stmt, bodyContext);
        if (code) {
          lines.push(code);
        }
      }
    }

    lines.push(`${indent}}`);

    return lines.join("\n");
  }

  private generateParameters(
    params: IRParameter[],
    context: CodeGenContext,
  ): string {
    const paramStrs = params.map(param => {
      let paramStr = "";

      // Determine type
      let type = param.type ? this.typeMapper.mapType(param.type) : "js::any";
      
      // Add const for immutable parameters
      if (!this.isPrimitive(type) && !param.rest) {
        paramStr = `const ${type}&`;
      } else {
        paramStr = type;
      }

      // Handle rest parameters
      if (param.rest) {
        paramStr = `std::vector<${type}>`;
      }

      // Add parameter name
      paramStr += ` ${param.name}`;

      // Add default value
      if (param.defaultValue) {
        const defaultExpr = this.expressionGen.generateExpression(param.defaultValue, context);
        paramStr += ` = ${defaultExpr}`;
      }

      return paramStr;
    }).join(", ");

    return `(${paramStrs})`;
  }

  private applyMemoryManagement(type: string, memory: MemoryManagement): string {
    // Don't wrap js:: types in smart pointers
    if (type.startsWith("js::")) {
      return type;
    }

    switch (memory) {
      case MemoryManagement.Shared:
        return `std::shared_ptr<${type}>`;
      case MemoryManagement.Unique:
        return `std::unique_ptr<${type}>`;
      case MemoryManagement.Weak:
        return `std::weak_ptr<${type}>`;
      case MemoryManagement.Raw:
        return `${type}*`;
      case MemoryManagement.Value:
      case MemoryManagement.Auto:
      default:
        return type;
    }
  }

  private isPrimitive(type: string): boolean {
    const primitives = new Set([
      "int", "unsigned", "long", "unsigned long", "long long", "unsigned long long",
      "float", "double", "long double",
      "char", "unsigned char", "signed char",
      "bool", "void",
      "int8_t", "uint8_t", "int16_t", "uint16_t",
      "int32_t", "uint32_t", "int64_t", "uint64_t",
      "size_t", "ptrdiff_t", "intptr_t", "uintptr_t",
      "js::number", "js::boolean"
    ]);

    return primitives.has(type);
  }

  private getIndent(context: CodeGenContext): string {
    return "  ".repeat(context.indentLevel);
  }
}