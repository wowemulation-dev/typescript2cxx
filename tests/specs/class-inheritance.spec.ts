/**
 * Class Inheritance Specification Tests
 * Tests extends, super, method overriding, and constructor chaining
 */

import { describe, it } from "@std/testing/bdd";
import { assertStringIncludes } from "@std/assert";
import { transpile } from "../../src/transpiler.ts";

describe("Class Inheritance", () => {
  describe("Basic inheritance with extends", () => {
    it("should generate C++ inheritance syntax", async () => {
      const code = `
        class Animal {
          name: string;
          constructor(name: string) {
            this.name = name;
          }
          speak(): void {
            console.log(this.name + " makes a sound");
          }
        }
        
        class Dog extends Animal {
          breed: string;
          constructor(name: string, breed: string) {
            super(name);
            this.breed = breed;
          }
        }
      `;
      const result = await transpile(code);

      // Check header file for class declarations
      assertStringIncludes(result.header, "class Animal");
      assertStringIncludes(result.header, "class Dog : public Animal");
      // Check source file for constructor implementation
      assertStringIncludes(result.source, "Animal(name)"); // super call in constructor
    });

    it("should handle simple inheritance without constructor", async () => {
      const code = `
        class Base {
          value: number = 10;
          getValue(): number {
            return this.value;
          }
        }
        
        class Derived extends Base {
          doubled(): number {
            return this.value * 2;
          }
        }
      `;
      const result = await transpile(code);

      assertStringIncludes(result.header, "class Base");
      assertStringIncludes(result.header, "class Derived : public Base");
      assertStringIncludes(result.header, "doubled()");
    });
  });

  describe("Method overriding", () => {
    it("should generate virtual functions for overridden methods", async () => {
      const code = `
        class Shape {
          area(): number {
            return 0;
          }
        }
        
        class Circle extends Shape {
          radius: number;
          constructor(radius: number) {
            super();
            this.radius = radius;
          }
          area(): number {
            return Math.PI * this.radius * this.radius;
          }
        }
      `;
      const result = await transpile(code);

      assertStringIncludes(result.header, "virtual");
      assertStringIncludes(result.header, "override");
      assertStringIncludes(result.header, "class Circle : public Shape");
    });

    it("should handle multiple levels of inheritance", async () => {
      const code = `
        class A {
          method1(): boolean {
            return false;
          }
        }
        
        class B extends A {
          method2(): boolean {
            return true;
          }
        }
        
        class C extends B {
          method3(): boolean {
            return false;
          }
        }
      `;
      const result = await transpile(code);

      assertStringIncludes(result.header, "class A");
      assertStringIncludes(result.header, "class B : public A");
      assertStringIncludes(result.header, "class C : public B");
    });
  });

  describe("Super calls", () => {
    it("should handle super method calls", async () => {
      const code = `
        class Parent {
          greet(): string {
            return "Hello from Parent";
          }
        }
        
        class Child extends Parent {
          greet(): string {
            return super.greet() + " and Child";
          }
        }
      `;
      const result = await transpile(code);

      assertStringIncludes(result.source, "Parent::greet()");
      assertStringIncludes(result.header, "class Child : public Parent");
    });

    it("should handle super constructor calls with parameters", async () => {
      const code = `
        class Vehicle {
          speed: number;
          constructor(speed: number) {
            this.speed = speed;
          }
        }
        
        class Car extends Vehicle {
          brand: string;
          constructor(speed: number, brand: string) {
            super(speed);
            this.brand = brand;
          }
        }
      `;
      const result = await transpile(code);

      assertStringIncludes(result.source, "Vehicle(speed)");
      assertStringIncludes(result.header, "class Car : public Vehicle");
    });

    it("should handle super property access", async () => {
      const code = `
        class Base {
          protected value: number = 42;
        }
        
        class Derived extends Base {
          getValue(): number {
            return super.value;
          }
        }
      `;
      const result = await transpile(code);

      assertStringIncludes(result.header, "protected:");
      assertStringIncludes(result.source, "Base::value");
    });
  });

  describe("Constructor chaining", () => {
    it("should handle constructor with default parameters", async () => {
      const code = `
        class A {
          v: number;
          s: string;
          constructor(k: number = 12) {
            this.v = k;
          }
        }
        
        class B extends A {
          q: number;
          constructor() {
            super();
            this.q = 17;
          }
        }
      `;
      const result = await transpile(code);

      assertStringIncludes(result.source, "A(12)"); // default parameter in super call
      assertStringIncludes(result.source, "this->q = 17");
    });

    it("should handle implicit super() call", async () => {
      const code = `
        class Parent {
          constructor() {
            console.log("Parent constructor");
          }
        }
        
        class Child extends Parent {
          // No explicit constructor - should call super() implicitly
        }
      `;
      const result = await transpile(code);

      assertStringIncludes(result.source, "class Child : public Parent");
      // Should inherit parent constructor or have default constructor
    });
  });

  describe("Abstract classes", () => {
    it("should generate abstract class with pure virtual functions", async () => {
      const code = `
        abstract class Animal {
          abstract makeSound(): void;
          move(): void {
            console.log("Moving...");
          }
        }
        
        class Dog extends Animal {
          makeSound(): void {
            console.log("Woof!");
          }
        }
      `;
      const result = await transpile(code);

      assertStringIncludes(result.header, "= 0"); // pure virtual function
      assertStringIncludes(result.header, "class Dog : public Animal");
      assertStringIncludes(result.header, "override");
    });
  });

  describe("Static inheritance", () => {
    it("should handle static methods in inheritance", async () => {
      const code = `
        class Parent {
          static staticMethod(): string {
            return "Parent static";
          }
        }
        
        class Child extends Parent {
          static staticMethod(): string {
            return "Child static";
          }
        }
      `;
      const result = await transpile(code);

      assertStringIncludes(result.source, "static");
      assertStringIncludes(result.source, "Parent::staticMethod");
      assertStringIncludes(result.source, "Child::staticMethod");
    });
  });

  describe("Access modifiers in inheritance", () => {
    it("should handle protected members", async () => {
      const code = `
        class Base {
          protected protectedValue: number = 10;
          private privateValue: number = 20;
          public publicValue: number = 30;
        }
        
        class Derived extends Base {
          useProtected(): number {
            return this.protectedValue;
          }
        }
      `;
      const result = await transpile(code);

      assertStringIncludes(result.source, "protected:");
      assertStringIncludes(result.source, "private:");
      assertStringIncludes(result.source, "public:");
    });
  });

  describe("Interface implementation with inheritance", () => {
    it("should handle class extending class and implementing interface", async () => {
      const code = `
        interface Flyable {
          fly(): void;
        }
        
        class Animal {
          name: string;
        }
        
        class Bird extends Animal implements Flyable {
          fly(): void {
            console.log("Flying");
          }
        }
      `;
      const result = await transpile(code);

      assertStringIncludes(result.source, "class Bird : public Animal");
      assertStringIncludes(result.source, "fly()");
    });
  });

  describe("Property initialization", () => {
    it("should handle property initializers in derived class", async () => {
      const code = `
        class Base {
          baseValue: number = 1;
        }
        
        class Derived extends Base {
          derivedValue: number = 2;
          
          constructor() {
            super();
            console.log(this.baseValue + this.derivedValue);
          }
        }
      `;
      const result = await transpile(code);

      assertStringIncludes(result.source, "baseValue = 1");
      assertStringIncludes(result.source, "derivedValue = 2");
    });
  });

  describe("Complex inheritance patterns", () => {
    it("should handle method chaining in inheritance", async () => {
      const code = `
        class Chainable {
          value: number = 0;
          
          setValue(v: number): this {
            this.value = v;
            return this;
          }
        }
        
        class ExtendedChainable extends Chainable {
          multipliedValue: number = 0;
          
          multiply(factor: number): this {
            this.multipliedValue = this.value * factor;
            return this;
          }
        }
      `;
      const result = await transpile(code);

      assertStringIncludes(result.source, "class ExtendedChainable : public Chainable");
      assertStringIncludes(result.source, "return this");
    });

    it("should handle polymorphic behavior", async () => {
      const code = `
        class Animal {
          speak(): void {
            console.log("Some sound");
          }
        }
        
        class Dog extends Animal {
          speak(): void {
            console.log("Woof");
          }
        }
        
        class Cat extends Animal {
          speak(): void {
            console.log("Meow");
          }
        }
        
        function makeAnimalSpeak(animal: Animal): void {
          animal.speak();
        }
      `;
      const result = await transpile(code);

      assertStringIncludes(result.header, "virtual");
      assertStringIncludes(result.header, "class Dog : public Animal");
      assertStringIncludes(result.header, "class Cat : public Animal");
    });
  });
});