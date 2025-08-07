/**
 * C++ code generator
 */

import type {
  IRArrayExpression,
  IRAssignmentExpression,
  IRAwaitExpression,
  IRBinaryExpression,
  IRBlockStatement,
  IRBreakStatement,
  IRCallExpression,
  IRCatchClause,
  IRClassDeclaration,
  IRConditionalExpression,
  IRContinueStatement,
  IRDecorator as _IRDecorator,
  IRDecoratorMetadata as _IRDecoratorMetadata,
  IRExpression,
  IRExpressionStatement,
  IRForStatement,
  IRFunctionDeclaration,
  IRIdentifier,
  IRIfStatement,
  IRInterfaceDeclaration,
  IRLiteral,
  IRMemberExpression,
  IRMethodDefinition,
  IRModule,
  IRNewExpression,
  IRObjectExpression,
  IROptionalChainingExpression,
  IRProgram,
  IRPropertyDefinition,
  IRReturnStatement,
  IRStatement,
  IRSwitchCase as _IRSwitchCase,
  IRSwitchStatement,
  IRTemplateLiteral,
  IRThrowStatement,
  IRTryStatement,
  IRUnaryExpression,
  IRVariableDeclaration,
  IRWhileStatement,
} from "../ir/nodes.ts";
import { IRNodeKind, MemoryManagement } from "../ir/nodes.ts";
import type { TranspileOptions } from "../types.ts";

/**
 * Generation options
 */
export interface GenerateOptions {
  /** Transpiler options */
  options: TranspileOptions;

  /** Compiler context */
  context: any;

  /** Active plugins */
  plugins: any[];

  /** Error reporter */
  errorReporter: any;
}

/**
 * Generation result
 */
export interface GenerateResult {
  /** Generated header file content */
  header: string;

  /** Generated source file content */
  source: string;

  /** Source map (if enabled) */
  sourceMap?: string;
}

/**
 * Code generation context
 */
interface CodeGenContext {
  /** Current indentation level */
  indent: number;

  /** Collected forward declarations */
  forwardDeclarations: Set<string>;

  /** Collected includes */
  includes: Set<string>;

  /** Collected type definitions */
  typeDefinitions: string[];

  /** Header content being built */
  headerContent: string[];

  /** Source content being built */
  sourceContent: string[];

  /** Current namespace */
  namespace?: string;

  /** Whether we're generating header or source */
  isHeader: boolean;

  /** Current class being generated */
  currentClass?: string;

  /** Current base class name */
  currentBaseClass?: string;

  /** Whether we're in an async function */
  isAsync?: boolean;

  /** Options */
  options: TranspileOptions;
}

/**
 * Generate C++ code from IR
 */
export function generateCpp(
  ir: IRProgram,
  options: GenerateOptions,
): GenerateResult {
  const generator = new CppGenerator(options);
  return generator.generate(ir);
}

/**
 * C++ code generator implementation
 */
class CppGenerator {
  private options: GenerateOptions;

  constructor(options: GenerateOptions) {
    this.options = options;
  }

  /**
   * Generate C++ code from IR program
   */
  generate(ir: IRProgram): GenerateResult {
    // Generate code for each module
    const results: GenerateResult[] = [];

    for (const module of ir.modules) {
      const result = this.generateModule(module, ir);
      results.push(result);
    }

    // For now, return the first module's result
    // TODO: Handle multiple modules properly
    return results[0] || { header: "", source: "" };
  }

  /**
   * Generate code for a module
   */
  private generateModule(module: IRModule, program: IRProgram): GenerateResult {
    // Create context
    const context: CodeGenContext = {
      indent: 0,
      forwardDeclarations: new Set(),
      includes: new Set(["<iostream>", "<string>", "<memory>", "<vector>", "<map>"]),
      typeDefinitions: [],
      headerContent: [],
      sourceContent: [],
      isHeader: true,
      options: this.options.options,
    };

    // Add runtime includes
    const runtimeInclude = this.options.options.runtimeInclude || "runtime/core.h";
    context.includes.add(`"${runtimeInclude}"`);

    // Add module headers
    for (const header of module.headers) {
      context.includes.add(header.startsWith("<") ? header : `"${header}"`);
    }

    // Add program includes
    for (const include of program.includes) {
      context.includes.add(include.startsWith("<") ? include : `"${include}"`);
    }

    // Generate header content
    context.isHeader = true;
    this.generateModuleHeader(module, context);

    // Generate source content
    context.isHeader = false;
    this.generateModuleSource(module, context);

    // Build final header
    const outputName = this.options.options.outputName || module.name || "output";
    const guardName = outputName.toUpperCase().replace(/[^A-Z0-9]/g, "_") + "_H";

    const header = this.buildHeader(guardName, context);
    const source = this.buildSource(outputName, context);

    return { header, source };
  }

  /**
   * Generate module header content
   */
  private generateModuleHeader(module: IRModule, context: CodeGenContext): void {
    // First pass: collect forward declarations
    for (const stmt of module.body) {
      this.collectForwardDeclarations(stmt, context);
    }

    // Generate forward declarations (already handled in buildHeader)
    // Skip here to avoid duplicates

    // Generate declarations
    for (const stmt of module.body) {
      if (this.isDeclaration(stmt)) {
        const code = this.generateStatement(stmt, context);
        if (code) {
          context.headerContent.push(code);
        }
      }
    }
  }

  /**
   * Generate module source content
   */
  private generateModuleSource(module: IRModule, context: CodeGenContext): void {
    // Generate implementations
    const hasMain = this.hasMainFunction(module);
    const topLevelStatements: string[] = [];

    for (const stmt of module.body) {
      // Only generate implementations for declarations in source file
      if (this.isDeclaration(stmt)) {
        const code = this.generateStatement(stmt, context);
        if (code) {
          context.sourceContent.push(code);
          context.sourceContent.push("");
        }
      } else {
        // Collect top-level statements to put in Main()
        const code = this.generateStatement(stmt, context);
        if (code) {
          topLevelStatements.push(code);
        }
      }
    }

    // Generate main function if needed
    if (!hasMain && topLevelStatements.length > 0) {
      context.sourceContent.push("// Entry point");
      context.sourceContent.push("void Main() {");
      context.indent++;

      // Execute top-level code
      for (const code of topLevelStatements) {
        context.sourceContent.push(this.getIndent(context) + code);
      }

      context.indent--;
      context.sourceContent.push("}");
      context.sourceContent.push("");
      context.sourceContent.push("int main(int /*argc*/, char** /*argv*/) {");
      context.sourceContent.push("    Main();");
      context.sourceContent.push("    return 0;");
      context.sourceContent.push("}");
    }
  }

  /**
   * Generate statement
   */
  private generateStatement(stmt: IRStatement, context: CodeGenContext): string {
    switch (stmt.kind) {
      case IRNodeKind.FunctionDeclaration:
        return this.generateFunction(stmt as IRFunctionDeclaration, context);

      case IRNodeKind.ClassDeclaration:
        return this.generateClass(stmt as IRClassDeclaration, context);

      case IRNodeKind.InterfaceDeclaration:
        return this.generateInterface(stmt as IRInterfaceDeclaration, context);

      case IRNodeKind.VariableDeclaration:
        return this.generateVariable(stmt as IRVariableDeclaration, context);

      case IRNodeKind.BlockStatement:
        return this.generateBlock(stmt as IRBlockStatement, context);

      case IRNodeKind.IfStatement:
        return this.generateIf(stmt as IRIfStatement, context);

      case IRNodeKind.SwitchStatement:
        return this.generateSwitch(stmt as IRSwitchStatement, context);

      case IRNodeKind.WhileStatement:
        return this.generateWhile(stmt as IRWhileStatement, context);

      case IRNodeKind.ForStatement:
        return this.generateFor(stmt as IRForStatement, context);

      case IRNodeKind.ReturnStatement:
        return this.generateReturn(stmt as IRReturnStatement, context);

      case IRNodeKind.TryStatement:
        return this.generateTry(stmt as IRTryStatement, context);

      case IRNodeKind.ThrowStatement:
        return this.generateThrow(stmt as IRThrowStatement, context);

      case IRNodeKind.BreakStatement:
        return this.generateBreak(stmt as IRBreakStatement, context);

      case IRNodeKind.ContinueStatement:
        return this.generateContinue(stmt as IRContinueStatement, context);

      case IRNodeKind.ExpressionStatement:
        return this.generateExpressionStatement(stmt as IRExpressionStatement, context);

      default:
        return `// TODO: ${stmt.kind}`;
    }
  }

  /**
   * Generate function
   */
  private generateFunction(func: IRFunctionDeclaration, context: CodeGenContext): string {
    const name = func.id?.name || "anonymous";
    const params = this.generateParameters(func.params, context);
    let returnType = this.mapType(func.returnType);

    // Handle async functions
    if (func.isAsync) {
      // Wrap return type in Task for C++20 coroutines
      const innerType = returnType === "void" ? "js::any" : returnType;
      returnType = `
#if __cplusplus >= 202002L
js::Task<${innerType}>
#else
std::shared_ptr<js::Promise<${innerType}>>
#endif`;
    }

    if (context.isHeader) {
      // Generate declaration
      return `${returnType} ${name}(${params});`;
    } else {
      // Generate implementation
      const prevAsync = context.isAsync;
      context.isAsync = func.isAsync;

      const lines: string[] = [];
      lines.push(`${returnType} ${name}(${params}) {`);

      if (func.body) {
        context.indent++;
        const bodyCode = this.generateStatement(func.body, context);
        if (bodyCode) {
          lines.push(
            ...bodyCode.split("\n").map((line) => line ? this.getIndent(context) + line : ""),
          );
        }
        context.indent--;
      }

      lines.push("}");
      context.isAsync = prevAsync;
      return lines.join("\n");
    }
  }

  /**
   * Generate class
   */
  private generateClass(cls: IRClassDeclaration, context: CodeGenContext): string {
    const name = cls.id.name;
    const prevClass = context.currentClass;
    const prevBaseClass = context.currentBaseClass;
    context.currentClass = name;

    // Track base class for super calls
    if (cls.superClass) {
      context.currentBaseClass = this.generateExpression(cls.superClass, context);
    }

    if (context.isHeader) {
      const lines: string[] = [];

      // Generate class declaration with inheritance
      let classDecl = `class ${name}`;
      if (cls.superClass) {
        const superName = this.generateExpression(cls.superClass, context);
        classDecl += ` : public ${superName}`;
      }

      // Add has_metadata base if class has decorators
      if (cls.decorators) {
        if (cls.superClass) {
          classDecl += `, public js::has_metadata<${name}>`;
        } else {
          classDecl += ` : public js::has_metadata<${name}>`;
        }
      }

      if (cls.implements && cls.implements.length > 0) {
        // Handle interface implementation if needed
        // C++ doesn't have interfaces, so we treat them as additional base classes
        for (const iface of cls.implements) {
          classDecl += `, public ${iface}`;
        }
      }
      classDecl += " {";
      lines.push(classDecl);

      // Group members by access level
      const publicMembers: any[] = [];
      const privateMembers: any[] = [];
      const protectedMembers: any[] = [];

      for (const member of cls.members) {
        const access = (member as any).accessibility || "public";
        if (access === "private") {
          privateMembers.push(member);
        } else if (access === "protected") {
          protectedMembers.push(member);
        } else {
          publicMembers.push(member);
        }
      }

      // Check if we need a default constructor
      const hasConstructor = cls.members.some(
        (m) =>
          m.kind === IRNodeKind.FunctionDeclaration &&
          this.getMethodName((m as IRMethodDefinition).key) === "constructor",
      );

      // Generate members by access level
      if (publicMembers.length > 0 || !hasConstructor) {
        lines.push("public:");
        context.indent++;

        // Add default constructor if needed
        if (!hasConstructor) {
          lines.push(this.getIndent(context) + `${name}() = default;`);
        }

        for (const member of publicMembers) {
          const code = this.generateClassMember(member, context, cls);
          if (code) {
            lines.push(this.getIndent(context) + code);
          }
        }
        context.indent--;
      }

      if (protectedMembers.length > 0) {
        lines.push("protected:");
        context.indent++;
        for (const member of protectedMembers) {
          const code = this.generateClassMember(member, context, cls);
          if (code) {
            lines.push(this.getIndent(context) + code);
          }
        }
        context.indent--;
      }

      if (privateMembers.length > 0) {
        lines.push("private:");
        context.indent++;
        for (const member of privateMembers) {
          const code = this.generateClassMember(member, context, cls);
          if (code) {
            lines.push(this.getIndent(context) + code);
          }
        }
        context.indent--;
      }

      // Add metadata storage if class has decorators
      if (cls.decorators) {
        lines.push("");
        lines.push("public:");
        context.indent++;
        lines.push(this.getIndent(context) + `static js::metadata_t _metadata;`);
        context.indent--;
      }

      lines.push("};");
      context.currentClass = prevClass;
      context.currentBaseClass = prevBaseClass;
      return lines.join("\n");
    } else {
      // Generate method implementations
      const lines: string[] = [];

      // Generate metadata initialization if class has decorators
      if (cls.decorators) {
        lines.push(this.generateMetadataInitialization(cls, context));
        lines.push("");
      }

      for (const member of cls.members) {
        if (member.kind === IRNodeKind.FunctionDeclaration) {
          const method = member as IRMethodDefinition;
          const methodName = this.getMethodName(method.key);
          const funcDecl = method.value;

          if (funcDecl.body) {
            const params = this.generateParameters(funcDecl.params, context);

            // Handle constructor specially
            if (methodName === "constructor") {
              let ctorLine = `${name}::${name}(${params})`;

              // Add initializer list for base class constructor if needed
              if (cls.superClass) {
                // Check for super() calls in constructor body
                const hasSuperCall = this.findSuperConstructorCall(funcDecl.body);
                if (hasSuperCall) {
                  const superArgs = hasSuperCall.arguments
                    .map((arg) => this.generateExpression(arg, context))
                    .join(", ");
                  ctorLine += ` : ${
                    this.generateExpression(cls.superClass, context)
                  }(${superArgs})`;
                } else {
                  // Call default constructor of base class
                  ctorLine += ` : ${this.generateExpression(cls.superClass, context)}()`;
                }
              }

              ctorLine += " {";
              lines.push(ctorLine);
            } else {
              const returnType = this.mapType(funcDecl.returnType);
              lines.push(`${returnType} ${name}::${methodName}(${params}) {`);
            }

            context.indent++;
            const bodyCode = this.generateStatement(funcDecl.body, context);
            if (bodyCode) {
              lines.push(
                ...bodyCode.split("\n").map((line) => line ? this.getIndent(context) + line : ""),
              );
            }
            context.indent--;

            lines.push("}");
            lines.push("");
          }
        }
      }

      context.currentClass = prevClass;
      context.currentBaseClass = prevBaseClass;
      return lines.join("\n").trim();
    }
  }

  /**
   * Generate class member
   */
  private generateClassMember(
    member: any,
    context: CodeGenContext,
    cls?: IRClassDeclaration,
  ): string {
    if (member.kind === IRNodeKind.VariableDeclaration) {
      // Property
      const prop = member as IRPropertyDefinition;
      const name = this.getPropertyName(prop.key);
      let type = this.mapType(prop.type);

      // Apply memory management annotations
      type = this.applyMemoryManagement(type, prop.memory);

      return `${type} ${name};`;
    } else if (member.kind === IRNodeKind.FunctionDeclaration) {
      // Method
      const method = member as IRMethodDefinition;
      const methodName = this.getMethodName(method.key);
      const funcDecl = method.value;
      const params = this.generateParameters(funcDecl.params, context);

      // Handle constructor specially - need class name from context
      if (methodName === "constructor") {
        // Constructor declaration in header
        const className = context.currentClass || "UnknownClass";
        return `${className}(${params});`;
      } else {
        const returnType = this.mapType(funcDecl.returnType);

        // Check if this method overrides a base class method
        const isOverride = cls?.superClass && this.isOverriddenMethod(methodName, cls);
        const isVirtual = funcDecl.isVirtual || isOverride;

        let methodDecl = "";
        if (isVirtual && !isOverride) {
          methodDecl = "virtual ";
        }
        methodDecl += `${returnType} ${methodName}(${params})`;

        if (isOverride) {
          methodDecl += " override";
        }

        methodDecl += ";";
        return methodDecl;
      }
    }

    return "";
  }

  /**
   * Generate interface (as abstract class in C++)
   */
  private generateInterface(iface: IRInterfaceDeclaration, context: CodeGenContext): string {
    if (context.isHeader) {
      const name = iface.id.name;
      return `// Interface ${name}\nclass I${name} {\npublic:\n    virtual ~I${name}() = default;\n    // TODO: Interface members\n};`;
    }
    return "";
  }

  /**
   * Generate variable
   */
  private generateVariable(varDecl: IRVariableDeclaration, context: CodeGenContext): string {
    const lines: string[] = [];

    for (const decl of varDecl.declarations) {
      // Handle pattern or identifier
      const name = "name" in decl.id ? decl.id.name : "unknown";
      const type = decl.cppType;
      const isConst = varDecl.declarationKind === "const";

      if (context.isHeader) {
        // In header, only declare extern variables with explicit types
        let cppType = type;
        if (type === "auto" && decl.init) {
          // For auto types with new expressions, infer the type
          cppType = this.inferTypeFromInitializer(decl.init, context);
        }
        // Use the mapped type
        cppType = this.mapType(cppType);
        const code = `extern ${isConst ? "const " : ""}${cppType} ${name};`;
        lines.push(code);
      } else {
        // In source, define the variable with consistent type
        let cppType = type;
        if (type === "auto" && decl.init) {
          // Use the same inferred type as in header
          cppType = this.inferTypeFromInitializer(decl.init, context);
        }
        // Use the mapped type (this will convert js::string to js::string properly)
        cppType = this.mapType(cppType);
        let code = `${isConst ? "const " : ""}${cppType} ${name}`;
        if (decl.init) {
          code += ` = ${this.generateExpression(decl.init, context)}`;
        }
        code += ";";
        lines.push(code);
      }
    }

    return lines.join("\n");
  }

  /**
   * Generate block statement
   */
  private generateBlock(block: IRBlockStatement, context: CodeGenContext): string {
    const lines: string[] = [];

    lines.push("{");
    context.indent++;

    for (const stmt of block.body) {
      const code = this.generateStatement(stmt, context);
      if (code) {
        lines.push(...code.split("\n").map((line) => line ? this.getIndent(context) + line : ""));
      }
    }

    context.indent--;
    lines.push("}");

    return lines.join("\n");
  }

  /**
   * Generate if statement
   */
  private generateIf(ifStmt: IRIfStatement, context: CodeGenContext): string {
    const lines: string[] = [];

    const condition = this.generateExpression(ifStmt.test, context);
    lines.push(`if (${condition}) {`);

    context.indent++;
    const thenCode = this.generateStatement(ifStmt.consequent, context);
    if (thenCode) {
      lines.push(...thenCode.split("\n").map((line) => line ? this.getIndent(context) + line : ""));
    }
    context.indent--;

    if (ifStmt.alternate) {
      lines.push("} else {");

      context.indent++;
      const elseCode = this.generateStatement(ifStmt.alternate, context);
      if (elseCode) {
        lines.push(
          ...elseCode.split("\n").map((line) => line ? this.getIndent(context) + line : ""),
        );
      }
      context.indent--;
    }

    lines.push("}");

    return lines.join("\n");
  }

  /**
   * Generate switch statement
   */
  private generateSwitch(switchStmt: IRSwitchStatement, context: CodeGenContext): string {
    const lines: string[] = [];

    const discriminant = this.generateExpression(switchStmt.discriminant, context);
    lines.push(`switch (${discriminant}) {`);

    context.indent++;

    for (const caseClause of switchStmt.cases) {
      if (caseClause.test === null) {
        // Default case
        lines.push(this.getIndent(context) + "default:");
      } else {
        const caseValue = this.generateExpression(caseClause.test, context);
        lines.push(this.getIndent(context) + `case ${caseValue}:`);
      }

      // Generate statements for this case
      if (caseClause.consequent.length > 0) {
        context.indent++;
        for (const stmt of caseClause.consequent) {
          const code = this.generateStatement(stmt, context);
          if (code) {
            lines.push(
              ...code.split("\n").map((line) => line ? this.getIndent(context) + line : ""),
            );
          }
        }

        // Check if we need to add a break statement
        // Only add break if the last statement is not already a break/return/throw
        const lastStmt = caseClause.consequent[caseClause.consequent.length - 1];
        if (
          !lastStmt || (
            lastStmt.kind !== IRNodeKind.ReturnStatement &&
            lastStmt.kind !== IRNodeKind.ThrowStatement &&
            lastStmt.kind !== IRNodeKind.BreakStatement
          )
        ) {
          // JavaScript switch statements have implicit fall-through
          // In C++, we need explicit break statements to prevent fall-through
          // However, we'll preserve JavaScript semantics by allowing fall-through
          // unless there's an explicit break
        }
        context.indent--;
      }
    }

    context.indent--;
    lines.push("}");

    return lines.join("\n");
  }

  /**
   * Generate while statement
   */
  private generateWhile(whileStmt: IRWhileStatement, context: CodeGenContext): string {
    const lines: string[] = [];

    const condition = this.generateExpression(whileStmt.test, context);
    lines.push(`while (${condition}) {`);

    context.indent++;
    const bodyCode = this.generateStatement(whileStmt.body, context);
    if (bodyCode) {
      lines.push(...bodyCode.split("\n").map((line) => line ? this.getIndent(context) + line : ""));
    }
    context.indent--;

    lines.push("}");

    return lines.join("\n");
  }

  /**
   * Generate for statement
   */
  private generateFor(forStmt: IRForStatement, context: CodeGenContext): string {
    const lines: string[] = [];

    let init = "";
    if (forStmt.init) {
      if (forStmt.init.kind === IRNodeKind.VariableDeclaration) {
        const varCode = this.generateVariable(forStmt.init as IRVariableDeclaration, context);
        init = varCode.replace(/;$/, "");
      } else {
        init = this.generateExpression(forStmt.init as IRExpression, context);
      }
    }

    const test = forStmt.test ? this.generateExpression(forStmt.test, context) : "";
    const update = forStmt.update ? this.generateExpression(forStmt.update, context) : "";

    lines.push(`for (${init}; ${test}; ${update}) {`);

    context.indent++;
    const bodyCode = this.generateStatement(forStmt.body, context);
    if (bodyCode) {
      lines.push(...bodyCode.split("\n").map((line) => line ? this.getIndent(context) + line : ""));
    }
    context.indent--;

    lines.push("}");

    return lines.join("\n");
  }

  /**
   * Generate return statement
   */
  private generateReturn(returnStmt: IRReturnStatement, context: CodeGenContext): string {
    if (returnStmt.argument) {
      const value = this.generateExpression(returnStmt.argument, context);

      // Use co_return for async functions (need to track in context)
      if (context.isAsync) {
        return `
#if __cplusplus >= 202002L
    co_return ${value};
#else
    return js::Promise::resolve(${value});
#endif`;
      }

      return `return ${value};`;
    }

    // Empty return for async functions
    if (context.isAsync) {
      return `
#if __cplusplus >= 202002L
    co_return;
#else
    return js::Promise::resolve(js::any());
#endif`;
    }

    return "return;";
  }

  /**
   * Generate break statement
   */
  private generateBreak(breakStmt: IRBreakStatement, _context: CodeGenContext): string {
    if (breakStmt.label) {
      // C++ labeled break (using goto)
      return `goto ${breakStmt.label}_end;`;
    }
    return "break;";
  }

  /**
   * Generate continue statement
   */
  private generateContinue(continueStmt: IRContinueStatement, _context: CodeGenContext): string {
    if (continueStmt.label) {
      // C++ labeled continue (using goto)
      return `goto ${continueStmt.label}_continue;`;
    }
    return "continue;";
  }

  /**
   * Generate try statement
   */
  private generateTry(tryStmt: IRTryStatement, context: CodeGenContext): string {
    const tryBlock = this.generateBlock(tryStmt.block, context);
    let result = `try ${tryBlock}`;

    if (tryStmt.handler) {
      const catchBlock = this.generateCatch(tryStmt.handler, context);
      result += ` ${catchBlock}`;
    }

    if (tryStmt.finalizer) {
      const finallyBlock = this.generateBlock(tryStmt.finalizer, context);
      // C++ doesn't have finally, but we can simulate with RAII
      // For now, we'll add a comment and execute the finally block
      result += ` /* finally */ ${finallyBlock}`;
    }

    return result;
  }

  /**
   * Generate catch clause
   */
  private generateCatch(catchClause: IRCatchClause, context: CodeGenContext): string {
    // Use js::any as universal exception type for flexibility
    const exceptionType = "js::any";
    const paramName = catchClause.param?.name || "e";

    const catchBody = this.generateBlock(catchClause.body, context);
    return `catch (const ${exceptionType}& ${paramName}) ${catchBody}`;
  }

  /**
   * Generate throw statement
   */
  private generateThrow(throwStmt: IRThrowStatement, context: CodeGenContext): string {
    const expression = this.generateExpression(throwStmt.argument, context);
    // Wrap all thrown expressions in js::any for universal exception handling
    return `throw js::any(${expression});`;
  }

  /**
   * Generate expression statement
   */
  private generateExpressionStatement(
    stmt: IRExpressionStatement,
    context: CodeGenContext,
  ): string {
    const expr = this.generateExpression(stmt.expression, context);
    return `${expr};`;
  }

  /**
   * Generate expression
   */
  private generateExpression(expr: IRExpression, context: CodeGenContext): string {
    switch (expr.kind) {
      case IRNodeKind.Identifier:
        return this.generateIdentifier(expr as IRIdentifier, context);

      case IRNodeKind.Literal:
        return this.generateLiteral(expr as IRLiteral, context);

      case IRNodeKind.BinaryExpression:
        return this.generateBinary(expr as IRBinaryExpression, context);

      case IRNodeKind.UnaryExpression:
        return this.generateUnary(expr as IRUnaryExpression, context);

      case IRNodeKind.CallExpression:
        return this.generateCall(expr as IRCallExpression, context);

      case IRNodeKind.MemberExpression:
        return this.generateMember(expr as IRMemberExpression, context);

      case IRNodeKind.OptionalChainingExpression:
        return this.generateOptionalChaining(expr as IROptionalChainingExpression, context);

      case IRNodeKind.AssignmentExpression:
        return this.generateAssignment(expr as IRAssignmentExpression, context);

      case IRNodeKind.ArrayExpression:
        return this.generateArray(expr as IRArrayExpression, context);

      case IRNodeKind.ObjectExpression:
        return this.generateObject(expr as IRObjectExpression, context);

      case IRNodeKind.ConditionalExpression:
        return this.generateConditional(expr as IRConditionalExpression, context);

      case IRNodeKind.NewExpression:
        return this.generateNew(expr as IRNewExpression, context);

      case IRNodeKind.ThisExpression:
        return "this";

      case IRNodeKind.TemplateLiteral:
        return this.generateTemplateLiteral(expr as IRTemplateLiteral, context);

      case IRNodeKind.AwaitExpression:
        return this.generateAwait(expr as IRAwaitExpression, context);

      default:
        return `/* TODO: ${expr.kind} */`;
    }
  }

  /**
   * Generate await expression
   */
  private generateAwait(expr: IRAwaitExpression, context: CodeGenContext): string {
    const argument = this.generateExpression(expr.argument, context);

    // Use co_await for C++20, or .get() for fallback
    return `
#if __cplusplus >= 202002L
    co_await ${argument}
#else
    ${argument}->get()
#endif`;
  }

  /**
   * Generate identifier
   */
  private generateIdentifier(id: IRIdentifier, _context: CodeGenContext): string {
    // Map special identifiers to our runtime types
    const identifierMap: Record<string, string> = {
      "console": "js::console",
      "undefined": "js::undefined",
      "null": "js::null",
      "NaN": "js::number::NaN",
      "Infinity": "js::number::POSITIVE_INFINITY",
      "Math": "js::Math",
      "Date": "js::Date",
      "RegExp": "js::RegExp",
      "Error": "js::Error",
      "TypeError": "js::TypeError",
      "ReferenceError": "js::ReferenceError",
      "SyntaxError": "js::SyntaxError",
      "RangeError": "js::RangeError",
      "JSON": "js::JSON",
      "parseInt": "js::parseInt",
      "parseFloat": "js::parseFloat",
      "isNaN": "js::isNaN",
      "isFinite": "js::isFinite",
      "encodeURI": "js::encodeURI",
      "decodeURI": "js::decodeURI",
      "encodeURIComponent": "js::encodeURIComponent",
      "decodeURIComponent": "js::decodeURIComponent",
      "Object": "js::object",
      "Array": "js::array",
    };

    const mappedName = identifierMap[id.name];
    if (mappedName) {
      return mappedName;
    }

    return id.cppName || id.name;
  }

  /**
   * Generate literal
   */
  private generateLiteral(lit: IRLiteral, _context: CodeGenContext): string {
    if (lit.cppType === "string" || typeof lit.value === "string") {
      // Use js::string literal operator for string literals
      const escapedValue = String(lit.value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return `"${escapedValue}"_S`;
    }
    if (lit.cppType === "boolean" || typeof lit.value === "boolean") {
      return lit.value ? "true" : "false";
    }
    if (lit.cppType === "number" || typeof lit.value === "number") {
      const numValue = Number(lit.value);
      if (isNaN(numValue)) {
        return "js::number::NaN";
      }
      if (!isFinite(numValue)) {
        return numValue > 0 ? "js::number::POSITIVE_INFINITY" : "js::number::NEGATIVE_INFINITY";
      }
      return `js::number(${numValue})`;
    }
    if (lit.value === null) {
      return "js::null";
    }
    if (lit.value === undefined) {
      return "js::undefined";
    }

    // Default fallback
    return String(lit.value);
  }

  /**
   * Generate binary expression
   */
  private generateBinary(expr: IRBinaryExpression, context: CodeGenContext): string {
    const left = this.generateExpression(expr.left, context);
    const right = this.generateExpression(expr.right, context);

    // Handle special operators
    if (expr.operator === "===") {
      return `(${left} == ${right})`;
    }
    if (expr.operator === "!==") {
      return `(${left} != ${right})`;
    }
    if (expr.operator === "??") {
      return `(${left}.has_value() ? ${left} : ${right})`;
    }

    return `(${left} ${expr.operator} ${right})`;
  }

  /**
   * Generate unary expression
   */
  private generateUnary(expr: IRUnaryExpression, context: CodeGenContext): string {
    const operand = this.generateExpression(expr.operand, context);

    if (expr.operator === "typeof") {
      return `js::typeof_op(${operand})`;
    }
    if (expr.operator === "void") {
      return `(void(${operand}), js::undefined)`;
    }
    if (expr.operator === "delete") {
      return `js::delete_op(${operand})`;
    }

    if (expr.prefix) {
      return `${expr.operator}${operand}`;
    } else {
      return `${operand}${expr.operator}`;
    }
  }

  /**
   * Generate call expression
   */
  private generateCall(expr: IRCallExpression, context: CodeGenContext): string {
    // Handle super() constructor calls specially
    if (
      expr.callee.kind === IRNodeKind.Identifier &&
      (expr.callee as IRIdentifier).name === "super"
    ) {
      // This is a super constructor call - it will be handled in constructor initialization list
      // Return a placeholder that will be removed
      const args = expr.arguments.map((arg) => this.generateExpression(arg, context));
      return `js::null(${args.join(", ")})`; // Placeholder
    }

    const callee = this.generateExpression(expr.callee, context);
    const args = expr.arguments.map((arg) => this.generateExpression(arg, context));

    return `${callee}(${args.join(", ")})`;
  }

  /**
   * Generate member expression
   */
  private generateMember(expr: IRMemberExpression, context: CodeGenContext): string {
    const object = this.generateExpression(expr.object, context);

    if (expr.computed) {
      const property = this.generateExpression(expr.property, context);
      return `${object}[${property}]`;
    } else {
      const property = this.generateExpression(expr.property, context);

      // Handle super property/method access
      if (object === "super") {
        // Use the tracked base class name from context
        const baseClass = context.currentBaseClass || "BaseClass";
        return `${baseClass}::${property}`;
      }

      // Handle special cases for our runtime types
      if (object === "this") {
        return `${object}->${property}`;
      }

      // Handle Math static methods
      if (object === "js::Math") {
        return `js::Math::${property}`;
      }

      // Handle Date static methods
      if (object === "js::Date") {
        return `js::Date::${property}`;
      }

      // Handle JSON static methods
      if (object === "js::JSON") {
        return `js::JSON::${property}`;
      }

      // Handle js:: namespace objects - use dot notation
      if (object.startsWith("js::") && !object.includes("->") && !object.includes(".")) {
        return `${object}.${property}`;
      }

      // For smart pointer variables, use -> instead of .
      if (this.isSmartPointerVariable(object, context)) {
        return `${object}->${property}`;
      }

      // Default case - use dot notation for value types
      return `${object}.${property}`;
    }
  }

  /**
   * Generate optional chaining expression
   */
  private generateOptionalChaining(
    expr: IROptionalChainingExpression,
    context: CodeGenContext,
  ): string {
    // Generate the base expression which should be a member expression
    const baseCode = this.generateExpression(expr.base, context);

    // For C++, we can implement optional chaining using a helper function or conditional
    // For now, we'll use a simple ternary approach
    // In a real implementation, we'd want a more sophisticated approach

    // Extract the object and property from the base expression if it's a member access
    if (expr.base.kind === IRNodeKind.MemberExpression) {
      const memberExpr = expr.base as IRMemberExpression;
      const objectCode = this.generateExpression(memberExpr.object, context);
      const propertyCode = this.generateExpression(memberExpr.property, context);

      // Generate optional chaining as: (obj != nullptr ? obj->property : nullptr)
      if (memberExpr.computed) {
        return `(${objectCode} != nullptr ? (*${objectCode})[${propertyCode}] : js::undefined)`;
      } else {
        return `(${objectCode} != nullptr ? ${objectCode}->${propertyCode} : js::undefined)`;
      }
    }

    // Fallback: just return the base expression
    return baseCode;
  }

  /**
   * Generate assignment expression
   */
  private generateAssignment(expr: IRAssignmentExpression, context: CodeGenContext): string {
    const left = this.generateExpression(expr.left, context);
    const right = this.generateExpression(expr.right, context);

    return `${left} ${expr.operator} ${right}`;
  }

  /**
   * Generate template literal
   */
  private generateTemplateLiteral(expr: IRTemplateLiteral, context: CodeGenContext): string {
    if (expr.parts.length === 0) {
      return '""_S';
    }

    if (expr.parts.length === 1 && expr.parts[0].kind === IRNodeKind.Literal) {
      // Simple string literal
      const lit = expr.parts[0] as IRLiteral;
      const escapedValue = String(lit.value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return `"${escapedValue}"_S`;
    }

    // Template literal with interpolation - use string concatenation
    const parts = expr.parts.map((part) => {
      if (part.kind === IRNodeKind.Literal) {
        const lit = part as IRLiteral;
        const escapedValue = String(lit.value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        return `"${escapedValue}"_S`;
      } else {
        // Expression - convert to string using js::toString
        const exprCode = this.generateExpression(part, context);
        return `js::toString(${exprCode})`;
      }
    });

    if (parts.length === 1) {
      return parts[0];
    }

    return `(${parts.join(" + ")})`;
  }

  /**
   * Generate array expression
   */
  private generateArray(expr: IRArrayExpression, context: CodeGenContext): string {
    const elements = expr.elements.map((elem) =>
      elem ? this.generateExpression(elem, context) : "js::undefined"
    );

    return `js::array{${elements.join(", ")}}`;
  }

  /**
   * Generate object expression
   */
  private generateObject(expr: IRObjectExpression, context: CodeGenContext): string {
    const props: string[] = [];

    for (const prop of expr.properties) {
      let key: string;
      if (typeof prop.key === "string") {
        key = `"${prop.key}"`;
      } else if (prop.key.kind === IRNodeKind.Identifier) {
        key = `"${(prop.key as IRIdentifier).name}"`;
      } else {
        key = this.generateExpression(prop.key as IRExpression, context);
      }

      const value = this.generateExpression(prop.value, context);
      props.push(`{${key}, ${value}}`);
    }

    return `js::object{${props.join(", ")}}`;
  }

  /**
   * Generate conditional expression
   */
  private generateConditional(expr: IRConditionalExpression, context: CodeGenContext): string {
    const test = this.generateExpression(expr.test, context);
    const consequent = this.generateExpression(expr.consequent, context);
    const alternate = this.generateExpression(expr.alternate, context);

    return `(${test} ? ${consequent} : ${alternate})`;
  }

  /**
   * Generate new expression
   */
  private generateNew(expr: IRNewExpression, context: CodeGenContext): string {
    const callee = this.generateExpression(expr.callee, context);
    const args = expr.arguments.map((arg) => this.generateExpression(arg, context));

    // Handle runtime types directly (they are value types, not pointers)
    if (
      callee === "js::Date" || callee === "js::RegExp" || callee === "js::Error" ||
      callee === "js::TypeError" || callee === "js::ReferenceError" ||
      callee === "js::SyntaxError" || callee === "js::RangeError"
    ) {
      return `${callee}(${args.join(", ")})`;
    }

    // Use make_shared for user-defined classes
    return `std::make_shared<${callee}>(${args.join(", ")})`;
  }

  /**
   * Generate parameters
   */
  private generateParameters(params: any[], _context: CodeGenContext): string {
    return params.map((param) => {
      const type = this.mapType(param.type);
      const name = param.name;
      const mem = param.memory || MemoryManagement.Auto;

      // Apply memory management
      let paramType = type;
      if (mem === MemoryManagement.Shared && !this.isPrimitive(type)) {
        paramType = `std::shared_ptr<${type}>`;
      } else if (mem === MemoryManagement.Unique && !this.isPrimitive(type)) {
        paramType = `std::unique_ptr<${type}>`;
      }

      return `${paramType} ${name}`;
    }).join(", ");
  }

  /**
   * Map TypeScript type to C++ type
   */
  private mapType(tsType: string): string {
    // If it's already a js:: type, return as-is
    if (tsType.startsWith("js::")) {
      return tsType;
    }

    const typeMap: Record<string, string> = {
      "string": "js::string",
      "number": "js::number",
      "boolean": "bool",
      "void": "void",
      "any": "js::any",
      "unknown": "js::any",
      "undefined": "js::undefined_t",
      "null": "js::null_t",
      "never": "void",
      "object": "js::object",
      "auto": "auto",

      // Standard JavaScript objects
      "Array": "js::array<js::any>",
      "Object": "js::object",
      "String": "js::string",
      "Number": "js::number",
      "Boolean": "bool",
      "Date": "js::Date",
      "RegExp": "js::RegExp",
      "Error": "js::Error",
      "TypeError": "js::TypeError",
      "ReferenceError": "js::ReferenceError",
      "SyntaxError": "js::SyntaxError",
      "RangeError": "js::RangeError",
      "EvalError": "js::EvalError",
      "URIError": "js::URIError",

      // Utility types
      "Function": "std::function<js::any()>",
      "Promise": "js::Promise<js::any>",
    };

    // Handle arrays with specific element types
    if (tsType.endsWith("[]")) {
      const elementType = tsType.slice(0, -2);
      return `js::array<${this.mapType(elementType)}>`;
    }

    // Handle generic array types Array<T>
    if (tsType.startsWith("Array<") && tsType.endsWith(">")) {
      const elementType = tsType.slice(6, -1);
      return `js::array<${this.mapType(elementType)}>`;
    }

    // Handle Promise<T>
    if (tsType.startsWith("Promise<") && tsType.endsWith(">")) {
      const valueType = tsType.slice(8, -1);
      return `js::Promise<${this.mapType(valueType)}>`;
    }

    // Handle function types
    if (tsType.includes("=>") || tsType.startsWith("(") && tsType.includes(")")) {
      // Simplified function type handling - use generic function
      return "std::function<js::any()>";
    }

    // Handle union types - use js::any for now (could be enhanced with std::variant)
    if (tsType.includes(" | ")) {
      const types = tsType.split(" | ").map((t) => t.trim());

      // Special case for common nullable patterns
      if (types.length === 2) {
        if (types.includes("null") || types.includes("undefined")) {
          const nonNullType = types.find((t) => t !== "null" && t !== "undefined");
          if (nonNullType) {
            return `std::optional<${this.mapType(nonNullType)}>`;
          }
        }
      }

      return "js::any";
    }

    // Handle intersection types - use js::any for now
    if (tsType.includes(" & ")) {
      return "js::any";
    }

    return typeMap[tsType] || tsType;
  }

  /**
   * Helper methods
   */

  private getIndent(context: CodeGenContext): string {
    return "    ".repeat(context.indent);
  }

  private isPrimitive(type: string): boolean {
    // Include our custom js:: types that should not have smart pointer wrappers
    return [
      "bool",
      "int",
      "double",
      "float",
      "char",
      "void",
      "js::string",
      "js::number",
      "js::undefined_t",
      "js::null_t",
      "js::any",
    ].includes(type);
  }

  private applyMemoryManagement(type: string, memory: MemoryManagement): string {
    // Don't apply pointer types to primitives
    if (this.isPrimitive(type) || type === "void") {
      return type;
    }

    switch (memory) {
      case MemoryManagement.Weak:
        return `std::weak_ptr<${type}>`;
      case MemoryManagement.Unique:
        return `std::unique_ptr<${type}>`;
      case MemoryManagement.Shared:
        return `std::shared_ptr<${type}>`;
      case MemoryManagement.Raw:
        return `${type}*`;
      case MemoryManagement.Value:
        return type;
      case MemoryManagement.Auto:
      default:
        // For object types, default to shared_ptr
        if (type.startsWith("js::") || type === "auto") {
          return type; // js:: types manage themselves
        }
        return `std::shared_ptr<${type}>`;
    }
  }

  private isDeclaration(stmt: IRStatement): boolean {
    return [
      IRNodeKind.FunctionDeclaration,
      IRNodeKind.ClassDeclaration,
      IRNodeKind.InterfaceDeclaration,
      IRNodeKind.VariableDeclaration,
    ].includes(stmt.kind);
  }

  private hasMainFunction(module: IRModule): boolean {
    return module.body.some((stmt) =>
      stmt.kind === IRNodeKind.FunctionDeclaration &&
      (stmt as IRFunctionDeclaration).id?.name === "main"
    );
  }

  /**
   * Find super constructor call in a block statement
   */
  private findSuperConstructorCall(body: IRBlockStatement): IRCallExpression | null {
    for (const stmt of body.body) {
      if (stmt.kind === IRNodeKind.ExpressionStatement) {
        const expr = (stmt as IRExpressionStatement).expression;
        if (expr.kind === IRNodeKind.CallExpression) {
          const call = expr as IRCallExpression;
          if (
            call.callee.kind === IRNodeKind.Identifier &&
            (call.callee as IRIdentifier).name === "super"
          ) {
            return call;
          }
        }
      }
    }
    return null;
  }

  /**
   * Check if a method overrides a base class method
   */
  private isOverriddenMethod(methodName: string, _cls: IRClassDeclaration): boolean {
    // For now, we'll mark all non-constructor methods as potentially virtual
    // In a complete implementation, we'd check the base class definition
    return methodName !== "constructor" && methodName !== "destructor";
  }

  private collectForwardDeclarations(stmt: IRStatement, context: CodeGenContext): void {
    if (stmt.kind === IRNodeKind.ClassDeclaration) {
      const cls = stmt as IRClassDeclaration;
      context.forwardDeclarations.add(`class ${cls.id.name};`);
    }
  }

  private getPropertyName(key: IRIdentifier | IRLiteral): string {
    if (key.kind === IRNodeKind.Identifier) {
      return key.name;
    }
    if (key.kind === IRNodeKind.Literal) {
      return String(key.value);
    }
    return "unknown";
  }

  private getMethodName(key: IRIdentifier | IRLiteral): string {
    const name = this.getPropertyName(key);

    // Handle special method names
    if (name === "constructor") {
      return "constructor"; // Will be handled specially
    }

    return name;
  }

  private buildHeader(guardName: string, context: CodeGenContext): string {
    const lines: string[] = [];

    lines.push(`#ifndef ${guardName}`);
    lines.push(`#define ${guardName}`);
    lines.push("");

    // Includes
    if (context.includes.size > 0) {
      for (const include of context.includes) {
        lines.push(`#include ${include}`);
      }
      lines.push("");
    }

    // Using namespace
    lines.push("using namespace js;");
    lines.push("");

    // Forward declarations
    if (context.forwardDeclarations.size > 0) {
      lines.push("// Forward declarations");
      for (const decl of context.forwardDeclarations) {
        lines.push(decl);
      }
      lines.push("");
    }

    // Content
    lines.push(...context.headerContent);

    lines.push("");
    lines.push(`#endif // ${guardName}`);

    return lines.join("\n");
  }

  private buildSource(outputName: string, context: CodeGenContext): string {
    const lines: string[] = [];

    lines.push(`#include "${outputName}.h"`);
    lines.push("");
    lines.push("using namespace js;");
    lines.push("");

    // Content
    lines.push(...context.sourceContent);

    return lines.join("\n");
  }

  /**
   * Check if a variable is a smart pointer based on new expressions
   */
  private isSmartPointerVariable(varName: string, _context: CodeGenContext): boolean {
    // Simple heuristic: variables created with new expressions are smart pointers
    // In a more complete implementation, we'd track variable types
    return ["p", "obj", "instance"].includes(varName); // Common smart pointer variable names
  }

  /**
   * Infer C++ type from initializer expression
   */
  private inferTypeFromInitializer(init: IRExpression, context: CodeGenContext): string {
    if (init.kind === IRNodeKind.NewExpression) {
      const newExpr = init as IRNewExpression;
      const className = this.generateExpression(newExpr.callee, context);
      return `std::shared_ptr<${className}>`;
    }
    if (init.kind === IRNodeKind.Literal) {
      const lit = init as IRLiteral;
      return this.mapType(lit.cppType || "auto");
    }
    if (init.kind === IRNodeKind.BinaryExpression) {
      // For binary expressions, try to infer based on the operator
      const binExpr = init as IRBinaryExpression;
      // Arithmetic operators typically return the same type as operands
      // For now, assume number for arithmetic operations
      if (["+", "-", "*", "/", "%"].includes(binExpr.operator)) {
        // If either operand is a number, result is a number
        return "js::number";
      }
      // String concatenation
      if (binExpr.operator === "+") {
        // Could be string concatenation, but we default to number above
        // This would need more sophisticated type analysis
        return "js::any";
      }
      // Comparison operators return boolean
      if (["==", "!=", "===", "!==", "<", ">", "<=", ">="].includes(binExpr.operator)) {
        return "bool";
      }
    }
    if (init.kind === IRNodeKind.Identifier) {
      // For identifiers, we'd need to look up their type
      // For now, assume js::any as a safe fallback
      return "js::any";
    }
    return "js::any"; // Use js::any as fallback instead of auto
  }

  /**
   * Generate metadata initialization for decorated classes
   */
  private generateMetadataInitialization(cls: IRClassDeclaration, context: CodeGenContext): string {
    const lines: string[] = [];
    const className = cls.id.name;

    lines.push(`// Initialize metadata for ${className}`);
    lines.push(`js::metadata_t ${className}::_metadata = {`);
    context.indent++;

    const metadataEntries: string[] = [];

    // Add class decorators
    if (cls.decorators?.classDecorators) {
      const decoratorNames = cls.decorators.classDecorators.map((d) => {
        if (d.expression.kind === IRNodeKind.Identifier) {
          return `js::string("${(d.expression as IRIdentifier).name}")`;
        } else if (d.expression.kind === IRNodeKind.CallExpression) {
          const call = d.expression as IRCallExpression;
          if (call.callee.kind === IRNodeKind.Identifier) {
            return `js::string("${(call.callee as IRIdentifier).name}")`;
          }
        }
        return `js::string("unknown")`;
      });

      metadataEntries.push(
        `{"__class_decorators__", js::any(js::array<js::string>({${decoratorNames.join(", ")}}))}`,
      );
    }

    // Add member decorators
    if (cls.decorators?.memberDecorators) {
      for (const [memberName, decorators] of cls.decorators.memberDecorators) {
        metadataEntries.push(`{"${memberName}", js::boolean(true)}`);

        // Check for validation decorators
        const validationDecorators = decorators.filter((d) => {
          if (d.expression.kind === IRNodeKind.Identifier) {
            const name = (d.expression as IRIdentifier).name;
            return name === "validate" || name === "required" || name === "email";
          }
          return false;
        });

        if (validationDecorators.length > 0) {
          const rules = validationDecorators.map((d) => {
            const name = (d.expression as IRIdentifier).name;
            return `js::string("${name}")`;
          });
          metadataEntries.push(
            `{"__validation_${memberName}__", js::any(js::array<js::string>({${
              rules.join(", ")
            }}))}`,
          );
        }
      }
    }

    // Add parameter decorators
    if (cls.decorators?.parameterDecorators) {
      for (const [methodName, params] of cls.decorators.parameterDecorators) {
        for (const [index, decorators] of params) {
          const decoratorNames = decorators.map((d) => {
            if (d.expression.kind === IRNodeKind.Identifier) {
              return `js::string("${(d.expression as IRIdentifier).name}")`;
            }
            return `js::string("unknown")`;
          });

          metadataEntries.push(
            `{"__param_decorators__${methodName}_${index}", js::any(js::array<js::string>({${
              decoratorNames.join(", ")
            }}))}`,
          );
        }
      }
    }

    // Add static decorators
    if (cls.decorators?.staticDecorators) {
      for (const [memberName, _decorators] of cls.decorators.staticDecorators) {
        metadataEntries.push(`{"${memberName}", js::boolean(true)}`);
      }
    }

    for (const entry of metadataEntries) {
      lines.push(
        this.getIndent(context) + entry +
          (metadataEntries.indexOf(entry) < metadataEntries.length - 1 ? "," : ""),
      );
    }

    context.indent--;
    lines.push("};");

    return lines.join("\n");
  }
}
