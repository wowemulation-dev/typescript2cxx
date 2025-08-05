/**
 * Example plugin for game engine integration
 * Shows how to extend typescript2cxx for domain-specific use cases
 */

import type {
  CustomEmitter as _CustomEmitter,
  EmitContext,
  IRNode,
  Logger as _Logger,
  Plugin,
  TransformContext,
  Transformer as _Transformer,
  TranspilerAccess as _TranspilerAccess,
  TypeInfo,
  TypeMappings as _TypeMappings,
} from "../../src/plugins/types.ts";

export const gameEnginePlugin: Plugin = {
  name: "game-engine-plugin",
  version: "1.0.0",
  description: "Adds game engine specific type mappings and transformations",

  // Custom type mappings for game engine types
  typeMappings: {
    simple: {
      // Math types
      "Vector2": "engine::Vector2",
      "Vector3": "engine::Vector3",
      "Vector4": "engine::Vector4",
      "Quaternion": "engine::Quaternion",
      "Matrix4x4": "engine::Matrix4x4",

      // Game object types
      "GameObject": "engine::GameObject",
      "Component": "engine::Component",
      "Transform": "engine::Transform",
      "Mesh": "engine::Mesh",
      "Texture": "engine::Texture",

      // Collections
      "GameObjectList": "engine::ObjectPool<engine::GameObject>",
    },

    complex: [
      // Handle generic component types
      (type: TypeInfo, _context) => {
        if (type.typeName.startsWith("Component<")) {
          const innerType = type.typeArguments?.[0];
          return `engine::Component<${innerType}>`;
        }
        return null;
      },

      // Handle event types
      (type: TypeInfo, _context) => {
        if (type.typeName.endsWith("Event")) {
          return `engine::Event<${type.typeName}>`;
        }
        return null;
      },
    ],

    overrides: {
      // Use fixed-point for better determinism
      "number": "engine::fixed32",
      // Use engine's string pool
      "string": "engine::PooledString",
    },
  },

  // Custom transformers
  transformers: [
    {
      name: "component-decorator",
      nodeKinds: ["ClassDeclaration"],
      priority: 100,

      transform(node: IRNode, context: TransformContext) {
        // Transform @Component decorator
        if (hasDecorator(node, "Component")) {
          const componentInfo = extractComponentInfo(node);

          // Add engine registration code
          const className = (node as any).id?.name || "UnknownComponent";
          context.addHelper(
            "registerComponent",
            `
            ENGINE_REGISTER_COMPONENT(${className}, {
              .updateOrder = ${componentInfo.updateOrder || 0},
              .category = "${componentInfo.category || "General"}"
            });
          `,
          );

          // Modify class to inherit from Component base
          return {
            ...node,
            extends: "engine::Component",
            decorators: (node as any).decorators?.filter((d: any) => d.name !== "Component") || [],
          };
        }

        return node;
      },
    },

    {
      name: "serializable-transformer",
      nodeKinds: ["PropertyDeclaration"],

      transform(node: IRNode, context: TransformContext) {
        // Transform @Serialize decorator
        if (hasDecorator(node, "Serialize")) {
          const propertyName = (node as any).key?.name || "unknown";
          context.addHelper(
            "serialization",
            `
            SERIALIZE_FIELD(${context.currentClass}, ${propertyName});
          `,
          );
        }

        return node;
      },
    },
  ],

  // Custom code emitters
  emitters: [
    {
      name: "shader-literal",
      nodeKinds: ["TaggedTemplateExpression"],

      emit(node: IRNode, _context: EmitContext): string | null {
        if ((node as any).tag === "shader") {
          const shaderCode = (node as any).template?.text;

          // Generate shader compilation
          return `engine::CompileShader(R"shader(${shaderCode})shader")`;
        }

        return null;
      },
    },

    {
      name: "vector-literal",
      nodeKinds: ["CallExpression"],

      emit(node: IRNode, _context: EmitContext): string | null {
        // Transform vec3(x, y, z) to engine syntax
        const expr = (node as any).expression;
        const args = (node as any).arguments;
        if (expr === "vec3" && args?.length === 3) {
          const [x, y, z] = args;
          return `engine::Vector3{${x}, ${y}, ${z}}`;
        }

        if (expr === "vec2" && args?.length === 2) {
          const [x, y] = args;
          return `engine::Vector2{${x}, ${y}}`;
        }

        return null;
      },
    },
  ],

  // Lifecycle hooks
  onInit(context: any) {
    context.logger.info("Game Engine Plugin initialized");

    // Add required headers
    context.transpiler?.emit?.addInclude?.("<engine/core.h>");
    context.transpiler?.emit?.addInclude?.("<engine/math.h>");
    context.transpiler?.emit?.addInclude?.("<engine/components.h>");
  },

  onBeforeTransform(ast: any, context: any) {
    // Scan for engine-specific imports
    const imports = findImports(ast);

    for (const imp of imports) {
      if (imp.module.startsWith("@engine/")) {
        // Transform engine imports to C++ includes
        const header = imp.module.replace("@engine/", "engine/") + ".h";
        context.transpiler?.emit?.addInclude?.(`<${header}>`);
      }
    }
  },

  onAfterTransform(code: string, context: any) {
    // Post-process generated code
    let processed = code;

    // Wrap in engine namespace if needed
    if ((context.options as any).wrapInNamespace) {
      processed = `namespace engine {\n\n${processed}\n\n} // namespace engine`;
    }

    // Add engine initialization if main function detected
    if (processed.includes("int main(")) {
      processed = processed.replace(
        "int main(",
        "int main(int argc, char* argv[]) {\n  engine::Initialize(argc, argv);\n\nint _main(",
      );
      processed = processed.replace(
        /return\s+0;\s*}$/,
        "return 0;\n\n  engine::Shutdown();\n  return _main();\n}",
      );
    }

    return processed;
  },
};

// Helper functions (would be part of plugin utilities)
function hasDecorator(node: any, name: string): boolean {
  return node.decorators?.some((d: any) => d.name === name) ?? false;
}

function extractComponentInfo(node: any): any {
  const decorator = node.decorators?.find((d: any) => d.name === "Component");
  return decorator?.arguments?.[0] ?? {};
}

function findImports(_ast: any): any[] {
  // Simplified import finder
  return [];
}

// Example usage in TypeScript code:
/*
import { Component, GameObject, Vector3 } from "@engine/core";

@Component({ updateOrder: 10, category: "Physics" })
class PlayerController extends Component {
  @Serialize
  speed: number = 5.0;

  @Serialize
  position: Vector3 = vec3(0, 0, 0);

  update(deltaTime: number): void {
    const movement = vec3(
      Input.getAxis("Horizontal"),
      0,
      Input.getAxis("Vertical")
    );

    this.position = this.position.add(movement.scale(this.speed * deltaTime));
  }

  onCollision(other: GameObject): void {
    console.log(shader`
      varying vec3 vPosition;
      void main() {
        gl_FragColor = vec4(vPosition, 1.0);
      }
    `);
  }
}
*/
