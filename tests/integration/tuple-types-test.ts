// Test for Tuple Types support

// Basic tuple types
const coordinates: [number, number] = [10, 20];
const point3D: [number, number, number] = [1.0, 2.0, 3.0];

// Mixed type tuple
const mixedTuple: [string, number, boolean] = ["hello", 42, true];

// Named tuple members (TypeScript 4.0+)
type NamedCoordinate = [x: number, y: number];
const namedPoint: NamedCoordinate = [5, 10];

// Optional elements in tuples
const optionalTuple: [string, number?] = ["required"];
const optionalWithValue: [string, number?] = ["with", 123];

// Rest elements in tuples
const tupleWithRest: [string, ...number[]] = ["first", 1, 2, 3, 4, 5];
const anotherRest: [boolean, string, ...string[]] = [true, "hello", "world", "!"];

// Function returning tuple
function getCoordinates(): [number, number] {
  return [100, 200];
}

// Function accepting tuple parameter
function processPoint(point: [number, number]): number {
  const [x, y] = point;
  return x + y;
}

// Destructuring tuples
const [x1, y1] = coordinates;
console.log("Destructured coordinates:", x1, y1);

const [_str, _num, _bool] = mixedTuple;

// Accessing tuple elements
const _firstCoord = coordinates[0];
const _secondCoord = coordinates[1];

// Tuple in array
const _points: [number, number][] = [
  [0, 0],
  [1, 1],
  [2, 4],
  [3, 9],
];

// Complex nested tuples
const _nestedTuple: [string, [number, boolean]] = ["outer", [42, false]];
const _tripleNested: [[string, number], [boolean, string]] = [["a", 1], [true, "b"]];

// Function with rest tuple parameters
function processRestTuple(...args: [string, number, ...boolean[]]): void {
  const [str, num, ...bools] = args;
  console.log("String:", str);
  console.log("Number:", num);
  console.log("Booleans:", bools);
}

// Using tuples
console.log("Coordinates:", coordinates);
console.log("Point 3D:", point3D);
console.log("Mixed tuple:", mixedTuple);
console.log("Sum of coordinates:", processPoint(coordinates));

const [resultX, resultY] = getCoordinates();
console.log("Result coordinates:", resultX, resultY);

// Test rest tuple
processRestTuple("test", 42, true, false, true);
