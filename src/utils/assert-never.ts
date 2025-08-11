/**
 * Exhaustive switch check utility
 * 
 * This utility function ensures that switch statements handle all possible
 * cases at compile time. If a case is not handled, TypeScript will produce
 * a compile-time error.
 */

/**
 * Assert that a value is never reached
 * 
 * This function is used in the default case of switch statements to ensure
 * all possible values are handled. If TypeScript allows this function to be
 * called, it means the switch statement is not exhaustive.
 * 
 * @param value The value that should never be reached
 * @param message Optional error message
 * @throws Error Always throws an error with details about the unhandled value
 * 
 * @example
 * ```typescript
 * type Action = "create" | "update" | "delete";
 * 
 * function handleAction(action: Action) {
 *   switch (action) {
 *     case "create":
 *       return createItem();
 *     case "update":
 *       return updateItem();
 *     case "delete":
 *       return deleteItem();
 *     default:
 *       return assertNever(action);
 *   }
 * }
 * ```
 * 
 * If a new action type is added to the Action union, TypeScript will
 * produce a compile-time error at the assertNever call.
 */
export function assertNever(value: never, message?: string): never {
  const errorMessage = message || `Unhandled value: ${JSON.stringify(value)}`;
  throw new Error(errorMessage);
}

/**
 * Assert that a discriminated union is exhaustively handled
 * 
 * Similar to assertNever but provides better error messages for
 * discriminated unions with a common property.
 * 
 * @param value The discriminated union value
 * @param discriminator The name of the discriminator property
 * @throws Error Always throws with details about the unhandled case
 * 
 * @example
 * ```typescript
 * type Shape = 
 *   | { kind: "circle"; radius: number }
 *   | { kind: "square"; size: number }
 *   | { kind: "triangle"; base: number; height: number };
 * 
 * function getArea(shape: Shape): number {
 *   switch (shape.kind) {
 *     case "circle":
 *       return Math.PI * shape.radius ** 2;
 *     case "square":
 *       return shape.size ** 2;
 *     case "triangle":
 *       return (shape.base * shape.height) / 2;
 *     default:
 *       return assertUnreachable(shape, "kind");
 *   }
 * }
 * ```
 */
export function assertUnreachable(
  value: never,
  discriminator?: string,
): never {
  const details = discriminator
    ? `Unhandled ${discriminator}: ${JSON.stringify((value as any)[discriminator])}`
    : `Unhandled case: ${JSON.stringify(value)}`;
  throw new Error(details);
}

/**
 * Type guard that asserts a value is never
 * 
 * This can be used in conditional logic to ensure exhaustiveness.
 * 
 * @param value The value to check
 * @returns Never returns (type guard that always throws)
 */
export function isNever(value: never): value is never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}

/**
 * Create a custom assertNever function with a specific error class
 * 
 * @param ErrorClass The error class to throw
 * @returns A customized assertNever function
 * 
 * @example
 * ```typescript
 * class UnhandledNodeError extends Error {
 *   constructor(public node: unknown) {
 *     super(`Unhandled node type: ${node}`);
 *   }
 * }
 * 
 * const assertNeverNode = createAssertNever(UnhandledNodeError);
 * 
 * switch (node.kind) {
 *   // ... cases
 *   default:
 *     assertNeverNode(node);
 * }
 * ```
 */
export function createAssertNever<E extends new (value: unknown) => Error>(
  ErrorClass: E,
): (value: never) => never {
  return (value: never): never => {
    throw new ErrorClass(value);
  };
}

/**
 * Ensure a switch statement is exhaustive at compile time
 * 
 * This is a compile-time only check that produces no runtime code.
 * It's useful for ensuring switch statements handle all cases without
 * adding runtime overhead.
 * 
 * @param check A function that switches over all possible values
 * 
 * @example
 * ```typescript
 * type Status = "pending" | "active" | "completed";
 * 
 * exhaustiveCheck<Status>((status) => {
 *   switch (status) {
 *     case "pending":
 *     case "active":
 *     case "completed":
 *       return;
 *     default:
 *       assertNever(status);
 *   }
 * });
 * ```
 */
export function exhaustiveCheck<T>(
  check: (value: T) => void,
): (value: T) => void {
  return check;
}

/**
 * Type-level exhaustiveness check
 * 
 * This type can be used to ensure a type parameter covers all cases
 * of a union type.
 * 
 * @example
 * ```typescript
 * type AllColors = "red" | "green" | "blue";
 * type HandledColors = "red" | "green";
 * 
 * // This will produce a type error because "blue" is not handled
 * type Check = ExhaustiveCheck<AllColors, HandledColors>;
 * ```
 */
export type ExhaustiveCheck<T, U extends T> = T extends U ? true : false;

/**
 * Runtime exhaustiveness validator
 * 
 * This class can be used to validate exhaustiveness at runtime,
 * useful for validating external data.
 * 
 * @example
 * ```typescript
 * const validator = new ExhaustivenessValidator<"a" | "b" | "c">();
 * validator.handle("a", () => console.log("handled a"));
 * validator.handle("b", () => console.log("handled b"));
 * validator.handle("c", () => console.log("handled c"));
 * validator.validate(); // Throws if not all cases are handled
 * ```
 */
export class ExhaustivenessValidator<T extends string | number | symbol> {
  private handledCases = new Set<T>();
  private allCases: Set<T>;

  constructor(allCases: readonly T[]) {
    this.allCases = new Set(allCases);
  }

  handle(value: T, handler: () => void): this {
    this.handledCases.add(value);
    handler();
    return this;
  }

  validate(): void {
    const unhandledCases = [...this.allCases].filter(
      (c) => !this.handledCases.has(c),
    );
    if (unhandledCases.length > 0) {
      throw new Error(
        `Unhandled cases: ${unhandledCases.map(String).join(", ")}`,
      );
    }
  }
}