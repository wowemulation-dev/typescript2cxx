import { describe, it } from "jsr:@std/testing/bdd";
import { runEndToEndTest } from "../../src/test-runner.ts";

const testE2E = async (code: string, expectedOutput: string) => {
  await runEndToEndTest(code, expectedOutput);
};

describe("Enums", () => {
  describe("Numeric Enums", () => {
    it("should handle basic numeric enum", async () => {
      const code = `
        enum Direction {
          Up,
          Down,
          Left,
          Right
        }
        
        console.log(Direction.Up);
        console.log(Direction.Down);
        console.log(Direction.Left);
        console.log(Direction.Right);
      `;

      await testE2E(code, "0\n1\n2\n3\n");
    });

    it("should handle numeric enum with initializer", async () => {
      const code = `
        enum Direction {
          Up = 1,
          Down,
          Left,
          Right
        }
        
        console.log(Direction.Up);
        console.log(Direction.Down);
        console.log(Direction.Left);
        console.log(Direction.Right);
      `;

      await testE2E(code, "1\n2\n3\n4\n");
    });

    it("should handle numeric enum with custom values", async () => {
      const code = `
        enum StatusCode {
          OK = 200,
          BadRequest = 400,
          NotFound = 404,
          InternalError = 500
        }
        
        console.log(StatusCode.OK);
        console.log(StatusCode.BadRequest);
        console.log(StatusCode.NotFound);
        console.log(StatusCode.InternalError);
      `;

      await testE2E(code, "200\n400\n404\n500\n");
    });

    it("should handle enum as function parameter", async () => {
      const code = `
        enum Color {
          Red,
          Green,
          Blue
        }
        
        function printColor(c: Color) {
          console.log(c);
        }
        
        printColor(Color.Red);
        printColor(Color.Green);
        printColor(Color.Blue);
      `;

      await testE2E(code, "0\n1\n2\n");
    });

    it("should handle enum comparison", async () => {
      const code = `
        enum Status {
          Active,
          Inactive,
          Pending
        }
        
        let status = Status.Active;
        console.log(status === Status.Active);
        console.log(status === Status.Inactive);
        
        status = Status.Pending;
        console.log(status === Status.Pending);
      `;

      await testE2E(code, "true\nfalse\ntrue\n");
    });
  });

  describe("String Enums", () => {
    it("should handle basic string enum", async () => {
      const code = `
        enum Direction {
          Up = "UP",
          Down = "DOWN",
          Left = "LEFT",
          Right = "RIGHT"
        }
        
        console.log(Direction.Up);
        console.log(Direction.Down);
        console.log(Direction.Left);
        console.log(Direction.Right);
      `;

      await testE2E(code, "UP\nDOWN\nLEFT\nRIGHT\n");
    });

    it("should handle string enum as function parameter", async () => {
      const code = `
        enum LogLevel {
          Error = "ERROR",
          Warning = "WARNING",
          Info = "INFO",
          Debug = "DEBUG"
        }
        
        function log(level: LogLevel, message: string) {
          console.log(level);
          console.log(message);
        }
        
        log(LogLevel.Error, "Something went wrong");
        log(LogLevel.Info, "Application started");
      `;

      await testE2E(code, "ERROR\nSomething went wrong\nINFO\nApplication started\n");
    });

    it("should handle string enum comparison", async () => {
      const code = `
        enum Role {
          Admin = "ADMIN",
          User = "USER",
          Guest = "GUEST"
        }
        
        let role = Role.Admin;
        console.log(role === Role.Admin);
        console.log(role === Role.User);
        
        role = Role.Guest;
        console.log(role === Role.Guest);
      `;

      await testE2E(code, "true\nfalse\ntrue\n");
    });
  });

  describe("Heterogeneous Enums", () => {
    it("should handle mixed numeric and string enum", async () => {
      const code = `
        enum Mixed {
          No = 0,
          Yes = "YES"
        }
        
        console.log(Mixed.No);
        console.log(Mixed.Yes);
      `;

      await testE2E(code, "0\nYES\n");
    });
  });

  describe("Const Enums", () => {
    it("should handle const enum", async () => {
      const code = `
        const enum Direction {
          Up,
          Down,
          Left,
          Right
        }
        
        console.log(Direction.Up);
        console.log(Direction.Down);
        console.log(Direction.Left);
        console.log(Direction.Right);
      `;

      await testE2E(code, "0\n1\n2\n3\n");
    });

    it("should inline const enum values", async () => {
      const code = `
        const enum Permissions {
          Read = 1,
          Write = 2,
          Execute = 4
        }
        
        let userPerms = Permissions.Read | Permissions.Write;
        console.log(userPerms);
        
        let adminPerms = Permissions.Read | Permissions.Write | Permissions.Execute;
        console.log(adminPerms);
      `;

      await testE2E(code, "3\n7\n");
    });
  });

  describe("Enum Reverse Mapping", () => {
    it("should support reverse mapping for numeric enums", async () => {
      const code = `
        enum Color {
          Red,
          Green,
          Blue
        }
        
        console.log(Color[0]);
        console.log(Color[1]);
        console.log(Color[2]);
      `;

      await testE2E(code, "Red\nGreen\nBlue\n");
    });
  });
});
