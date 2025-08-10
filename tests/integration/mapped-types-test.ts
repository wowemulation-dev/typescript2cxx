// Test for TypeScript mapped types
// Note: Since C++ doesn't have native mapped types, we demonstrate
// how mapped type concepts translate to C++ patterns

interface Person {
  name: string;
  age: number;
  email: string;
}

// Readonly pattern - in C++, this would use const
function makeReadonly(person: Person): Person {
  // Returns a const reference in C++
  return person;
}

// Partial pattern - optional properties
interface PartialPerson {
  name?: string;
  age?: number;
  email?: string;
}

function updatePartial(person: Person, updates: PartialPerson): Person {
  // Merge updates into person
  const result = { ...person };

  if (updates.name !== undefined) {
    result.name = updates.name;
  }
  if (updates.age !== undefined) {
    result.age = updates.age;
  }
  if (updates.email !== undefined) {
    result.email = updates.email;
  }

  return result;
}

// Nullable pattern - properties can be null
interface NullablePerson {
  name: string | null;
  age: number | null;
  email: string | null;
}

// Required pattern - all properties required (same as original)
function requireAll(partial: PartialPerson): Person {
  if (!partial.name || !partial.age || !partial.email) {
    throw new Error("All fields are required");
  }

  return {
    name: partial.name,
    age: partial.age,
    email: partial.email,
  };
}

// Pick pattern - select subset of properties
interface PersonName {
  name: string;
}

function getPersonName(person: Person): PersonName {
  return { name: person.name };
}

// Omit pattern - exclude properties
interface PersonWithoutEmail {
  name: string;
  age: number;
}

function removeEmail(person: Person): PersonWithoutEmail {
  return {
    name: person.name,
    age: person.age,
  };
}

// Test usage
function main() {
  const person: Person = {
    name: "John",
    age: 30,
    email: "john@example.com",
  };

  // Test readonly concept
  const readonlyPerson = makeReadonly(person);
  console.log("Readonly person:", readonlyPerson);

  // Test partial concept
  const updates: PartialPerson = {
    age: 31,
    // name and email are optional
  };

  const updatedPerson = updatePartial(person, updates);
  console.log("Original person:", person);
  console.log("Updated person:", updatedPerson);

  // Test nullable concept
  const nullablePerson: NullablePerson = {
    name: "Jane",
    age: null,
    email: "jane@example.com",
  };
  console.log("Nullable person:", nullablePerson);

  // Test pick concept
  const nameOnly = getPersonName(person);
  console.log("Name only:", nameOnly);

  // Test omit concept
  const withoutEmail = removeEmail(person);
  console.log("Without email:", withoutEmail);

  // Test required concept
  try {
    const required = requireAll({ name: "Test" });
    console.log("Required person:", required);
  } catch (e) {
    console.log("Error:", e);
  }
}

main();
