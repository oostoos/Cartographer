=== General style ===
- Prefer reducing cyclomatic complexity over reducing lines of code.

=== Python ===
- Use snake_case for variables, definitions, and file/directory names.

=== Typescript ===
- Use camelCase for variables and definitions, PascalCase for class names, and kebab-case for file/directory names.
- When making an interface, use the "I" prefix for the interface name. For example, an interface for a user would be named IUser.
- When making a type, use the "T" prefix for the type name. For example, a type for a user would be named TUser.

Good examples of my codestyle for Typescript:
```
export function isSameLocalDay(a: Date, b: Date): boolean {
  if (a.getFullYear() !== b.getFullYear()) {
    return false;
  }
  
  if (a.getMonth() !== b.getMonth()) {
    return false;
  }

  if (a.getDate() !== b.getDate()) {
    return false;
  }

  return true;
}
```
