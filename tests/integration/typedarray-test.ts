import { assertStringIncludes } from "@std/assert";
import { transpile } from "../../src/mod.ts";

Deno.test("TypedArray support - Uint8Array basic usage", async () => {
  const input = `
const data = new Uint8Array(10);
data[0] = 255;
data[1] = 128;

const value = data[0];
const length = data.length;
`;

  const result = await transpile(input);

  // TypedArrays should generate specific C++ typed array types
  assertStringIncludes(result.source, "Uint8Array");
  assertStringIncludes(result.source, "data");
  assertStringIncludes(result.source, "value");
  assertStringIncludes(result.source, "length");
});

Deno.test("TypedArray support - Int32Array with initialization", async () => {
  const input = `
const numbers = new Int32Array([1, 2, 3, 4, 5]);
const sum = numbers[0] + numbers[1] + numbers[2];

function processArray(arr: Int32Array): number {
  let total = 0;
  for (let i = 0; i < arr.length; i++) {
    total += arr[i];
  }
  return total;
}

const result = processArray(numbers);
`;

  const result = await transpile(input);

  assertStringIncludes(result.source, "Int32Array");
  assertStringIncludes(result.source, "processArray");
  assertStringIncludes(result.source, "total");
});

Deno.test("TypedArray support - Float64Array mathematical operations", async () => {
  const input = `
const values = new Float64Array(5);
values[0] = 3.14159;
values[1] = 2.71828;
values[2] = 1.41421;

const average = (values[0] + values[1] + values[2]) / 3;

function calculateMagnitude(arr: Float64Array): number {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i] * arr[i];
  }
  return Math.sqrt(sum);
}

const magnitude = calculateMagnitude(values);
`;

  const result = await transpile(input);

  assertStringIncludes(result.source, "Float64Array");
  assertStringIncludes(result.source, "calculateMagnitude");
  assertStringIncludes(result.source, "sqrt");
});

Deno.test("TypedArray support - Float32Array for graphics/gaming", async () => {
  const input = `
// Common in game engines for vertex data
const vertices = new Float32Array([
  0.0, 1.0, 0.0,  // vertex 1
  -1.0, -1.0, 0.0, // vertex 2
  1.0, -1.0, 0.0   // vertex 3
]);

function normalizeVector(vec: Float32Array, offset: number): void {
  const x = vec[offset];
  const y = vec[offset + 1];
  const z = vec[offset + 2];
  
  const length = Math.sqrt(x * x + y * y + z * z);
  
  vec[offset] = x / length;
  vec[offset + 1] = y / length;
  vec[offset + 2] = z / length;
}

normalizeVector(vertices, 0);
`;

  const result = await transpile(input);

  assertStringIncludes(result.source, "Float32Array");
  assertStringIncludes(result.source, "normalizeVector");
  assertStringIncludes(result.source, "vertices");
});

Deno.test("TypedArray support - Uint16Array for efficient storage", async () => {
  const input = `
// Efficient storage for small positive integers
const indices = new Uint16Array(100);

for (let i = 0; i < indices.length; i++) {
  indices[i] = i * 2;
}

const firstTen = indices.slice(0, 10);
const doubled = indices.map(x => x * 2);
`;

  const result = await transpile(input);

  assertStringIncludes(result.source, "Uint16Array");
  assertStringIncludes(result.source, "indices");
  assertStringIncludes(result.source, "firstTen");
});

Deno.test("TypedArray support - Int8Array signed byte operations", async () => {
  const input = `
const signedBytes = new Int8Array([-128, -64, 0, 64, 127]);

function processSignedData(data: Int8Array): Int8Array {
  const result = new Int8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = Math.max(-127, Math.min(127, data[i] * 2));
  }
  return result;
}

const processed = processSignedData(signedBytes);
`;

  const result = await transpile(input);

  assertStringIncludes(result.source, "Int8Array");
  assertStringIncludes(result.source, "processSignedData");
  assertStringIncludes(result.source, "processed");
});

Deno.test("TypedArray support - Uint32Array for large unsigned values", async () => {
  const input = `
const hashes = new Uint32Array(10);

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

hashes[0] = simpleHash("test");
hashes[1] = simpleHash("data");
`;

  const result = await transpile(input);

  assertStringIncludes(result.source, "Uint32Array");
  assertStringIncludes(result.source, "simpleHash");
  assertStringIncludes(result.source, "hashes");
});

Deno.test("TypedArray support - Int16Array for audio processing", async () => {
  const input = `
// Common for 16-bit audio samples
const audioSamples = new Int16Array(1024);

function generateSineWave(
  buffer: Int16Array,
  frequency: number,
  sampleRate: number
): void {
  for (let i = 0; i < buffer.length; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * frequency * t);
    buffer[i] = Math.round(sample * 32767);
  }
}

generateSineWave(audioSamples, 440, 44100);
`;

  const result = await transpile(input);

  assertStringIncludes(result.source, "Int16Array");
  assertStringIncludes(result.source, "generateSineWave");
  assertStringIncludes(result.source, "audioSamples");
});

Deno.test("TypedArray support - multiple TypedArray types interaction", async () => {
  const input = `
interface DataPacket {
  header: Uint8Array;
  payload: Uint32Array;
  checksum: Uint16Array;
}

function createPacket(data: number[]): DataPacket {
  const header = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
  const payload = new Uint32Array(data);
  const checksum = new Uint16Array([0xABCD]);
  
  return { header, payload, checksum };
}

const packet = createPacket([100, 200, 300, 400]);
const totalSize = packet.header.byteLength + packet.payload.byteLength + packet.checksum.byteLength;
`;

  const result = await transpile(input);

  assertStringIncludes(result.source, "DataPacket");
  assertStringIncludes(result.source, "createPacket");
  assertStringIncludes(result.source, "Uint8Array");
  assertStringIncludes(result.source, "Uint32Array");
  assertStringIncludes(result.source, "Uint16Array");
});

Deno.test("TypedArray support - TypedArray methods and properties", async () => {
  const input = `
const data = new Float32Array([1.1, 2.2, 3.3, 4.4, 5.5]);

// Test common TypedArray properties and methods
const length = data.length;
const byteLength = data.byteLength;
const bytesPerElement = data.BYTES_PER_ELEMENT;

// Subarray creates a view
const subData = data.subarray(1, 4);

// Set data from another array
const newData = new Float32Array(5);
newData.set([9.9, 8.8, 7.7]);
newData.set(data.subarray(3), 3);

// Fill operation
const zeros = new Int32Array(10);
zeros.fill(42);
`;

  const result = await transpile(input);

  assertStringIncludes(result.source, "Float32Array");
  assertStringIncludes(result.source, "byteLength");
  assertStringIncludes(result.source, "subarray");
  assertStringIncludes(result.source, "fill");
});
