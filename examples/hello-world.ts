// TypeScript source
console.log("Hello from TypeScript2Cxx!");

const name = "World";
const count = 42;

function greet(person: string): string {
  return `Hello, ${person}!`;
}

class Example {
  private message: string;

  constructor(msg: string) {
    this.message = msg;
  }

  display(): void {
    console.log(this.message);
  }
}

const example = new Example(greet(name));
example.display();

// Test various features
const numbers = [1, 2, 3, 4, 5];
const _doubled = numbers.map((n) => n * 2);

if (count > 40) {
  console.log("Count is large!");
}

for (let i = 0; i < numbers.length; i++) {
  console.log(`Number: ${numbers[i]}`);
}
