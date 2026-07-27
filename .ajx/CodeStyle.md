## General style

- Prefer reducing cyclomatic complexity over reducing lines of code.
- When several sibling definitions repeat the same structural scaffolding and
  only small pieces vary, extract the shared scaffold into a private helper
  that takes the varying pieces as parameters (or renders them as children),
  and have each definition call it supplying only what varies.

Before:

```typescript
function buildErrorMessage(detail: string): string {
  return `[ERROR] ${detail} (see logs)`;
}

function buildWarningMessage(detail: string): string {
  return `[WARNING] ${detail} (see logs)`;
}
```

After:

```typescript
function buildLabeledMessage(label: string, detail: string): string {
  return `[${label}] ${detail} (see logs)`;
}

const buildErrorMessage = (detail: string) => buildLabeledMessage("ERROR", detail);
const buildWarningMessage = (detail: string) => buildLabeledMessage("WARNING", detail);
```

- An if-statement whose body is non-trivial should split out the body into a private helper function with a descriptive name, and call that function from the if-statement.

## Python

- Use snake_case for variables, definitions, and file/directory names.

## Typescript

- Use camelCase for variables and definitions, PascalCase for class names, and kebab-case for file/directory names.
- When making an interface, use the "I" prefix for the interface name. For example, an interface for a user would be named IUser.
- When making a type, use the "T" prefix for the type name. For example, a type for a user would be named TUser.

Good examples of my codestyle for Typescript:

```typescript
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

## React 

- Use PascalCase for component names and kebab-case for file/directory names. If a file contains code to export a component, the file name should match the component name. For example, a component named MyComponent should be in a file named MyComponent.tsx.
- Use the "I" prefix for the interface name of a component's props. For example, a component named MyComponent should have an interface named IMyComponentProps.
- If a file doesn't need to be .tsx, don't make it .tsx. For example, a file that only contains a component's props interface should be .ts, not .tsx.