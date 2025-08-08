import { describe, it } from "jsr:@std/testing/bdd";
import { runEndToEndTest } from "../../src/test-runner.ts";

const testE2E = async (code: string, expectedOutput: string) => {
  await runEndToEndTest(code, expectedOutput);
};

describe("Abstract Classes", () => {
  it("should handle basic abstract class", async () => {
    const code = `
      abstract class Animal {
        protected name: string;
        
        constructor(name: string) {
          this.name = name;
        }
        
        abstract makeSound(): void;
        
        move(): void {
          console.log("Moving...");
        }
      }
      
      class Dog extends Animal {
        constructor(name: string) {
          super(name);
        }
        
        makeSound(): void {
          console.log("Woof!");
        }
      }
      
      const dog = new Dog("Buddy");
      dog.makeSound();
      dog.move();
    `;

    await testE2E(code, "Woof!\nMoving...\n");
  });

  it("should handle abstract methods with return types", async () => {
    const code = `
      abstract class Shape {
        abstract getArea(): number;
        abstract getPerimeter(): number;
        
        describe(): void {
          console.log("Area:");
          console.log(this.getArea());
          console.log("Perimeter:");
          console.log(this.getPerimeter());
        }
      }
      
      class Rectangle extends Shape {
        private width: number;
        private height: number;
        
        constructor(width: number, height: number) {
          super();
          this.width = width;
          this.height = height;
        }
        
        getArea(): number {
          return this.width * this.height;
        }
        
        getPerimeter(): number {
          return 2 * (this.width + this.height);
        }
      }
      
      const rect = new Rectangle(5, 3);
      rect.describe();
    `;

    await testE2E(code, "Area:\n15\nPerimeter:\n16\n");
  });

  it("should handle multiple levels of abstract inheritance", async () => {
    const code = `
      abstract class Vehicle {
        abstract start(): void;
        
        stop(): void {
          console.log("Stopping");
        }
      }
      
      abstract class MotorVehicle extends Vehicle {
        abstract getFuelType(): string;
        
        start(): void {
          console.log("Starting engine");
        }
      }
      
      class Car extends MotorVehicle {
        getFuelType(): string {
          return "Gasoline";
        }
      }
      
      const car = new Car();
      car.start();
      console.log(car.getFuelType());
      car.stop();
    `;

    await testE2E(code, "Starting engine\nGasoline\nStopping\n");
  });

  it("should handle abstract properties", async () => {
    const code = `
      abstract class Employee {
        abstract readonly id: number;
        abstract salary: number;
        
        constructor(public name: string) {}
        
        abstract calculateBonus(): number;
        
        displayInfo(): void {
          console.log(this.name);
          console.log(this.id);
          console.log(this.salary);
          console.log(this.calculateBonus());
        }
      }
      
      class Manager extends Employee {
        readonly id: number;
        salary: number;
        
        constructor(name: string, id: number, salary: number) {
          super(name);
          this.id = id;
          this.salary = salary;
        }
        
        calculateBonus(): number {
          return this.salary * 0.2;
        }
      }
      
      const manager = new Manager("Alice", 101, 100000);
      manager.displayInfo();
    `;

    await testE2E(code, "Alice\n101\n100000\n20000\n");
  });

  it("should prevent instantiation of abstract classes", async () => {
    const code = `
      abstract class BaseClass {
        abstract doSomething(): void;
      }
      
      class ConcreteClass extends BaseClass {
        doSomething(): void {
          console.log("Doing something");
        }
      }
      
      // This would be a compile-time error in TypeScript:
      // const base = new BaseClass(); // Error!
      
      const concrete = new ConcreteClass();
      concrete.doSomething();
    `;

    await testE2E(code, "Doing something\n");
  });

  it("should handle abstract static methods", async () => {
    const code = `
      abstract class Factory {
        abstract createProduct(): string;
        
        static getFactoryName(): string {
          return "Generic Factory";
        }
      }
      
      class CarFactory extends Factory {
        createProduct(): string {
          return "Car";
        }
        
        static getFactoryName(): string {
          return "Car Factory";
        }
      }
      
      const factory = new CarFactory();
      console.log(factory.createProduct());
      console.log(CarFactory.getFactoryName());
    `;

    await testE2E(code, "Car\nCar Factory\n");
  });
});
