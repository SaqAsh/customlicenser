# Codebase Standards

This document captures the coding standards for `customlicenser`. The baseline
is the **[Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)**,
enforced by [`gts`](https://github.com/google/gts). Everything below either
restates the subset of Google rules we actually exercise or documents the few
project-specific conventions that sit on top.

Toolchain that enforces this document:

| Tool                | Config file            | What it catches                                     |
| ------------------- | ---------------------- | --------------------------------------------------- |
| TypeScript (strict) | `tsconfig.json`        | Type errors, null/undefined handling                |
| ESLint + gts        | `eslint.config.js`     | Style, idioms, `no-floating-promises`, `no-any`     |
| Prettier (gts)      | `.prettierrc.json`     | Formatting                                          |
| `unused-imports`    | `eslint.config.js`     | Dead imports                                        |

Run `npm run check && npm run lint && npm run build` before opening a PR.
`npm run fix` (alias for `gts fix`) auto-fixes lint + format.

---

## 1. Formatting

Prettier with Google settings. Do not hand-format — `gts fix` is the source of
truth.

- 2-space indent, no tabs
- Single quotes
- Trailing commas everywhere
- No bracket spacing inside object literals: `{foo, bar}`
- Arrow parens avoided when possible: `x => x + 1`
- Semicolons required (never rely on ASI)
- Max line length: Prettier default (80)

---

## 2. File Layout

```
src/
├── extension.ts          # activate/deactivate entry points
├── commands/             # thin orchestration; delegates to services/managers
├── managers/             # stateful coordinators (license lifecycle, templates)
├── services/             # stateless helpers + VSCode-facing IO
├── handlers/             # cross-cutting utilities (e.g. tryCatch)
├── loggers/              # info/warn/error wrappers around vscode.window
├── constants/            # declarative data tables
├── types/                # shared types / interfaces
├── ui/                   # thin wrappers around `vscode.window.showX`
├── utils/                # pure, dependency-light helpers
└── test/                 # mocha test files
```

- One exported symbol per concept per file. Do not co-locate unrelated classes.
- Each folder has an `index.ts` barrel; imports go through the barrel.
- Services consume `IXxxService` interfaces, not concrete classes.

---

## 3. Naming

| Identifier            | Convention     | Example                        |
| --------------------- | -------------- | ------------------------------ |
| Classes, interfaces, type aliases, enums, decorators | `UpperCamelCase` | `LicenseManager`, `ILicenseManager`, `LicenseType` |
| Variables, parameters, functions, methods, properties, module aliases | `lowerCamelCase` | `licenseManager`, `addYearCommand`  |
| Module-level constants (including immutable arrays / sets / records) | `CONSTANT_CASE`  | `STANDARD_LICENSE_TYPES`, `SKIP_LANGUAGES`, `LICENSE_PHRASES` |
| Interface files       | `IXxx.ts`      | `IConfigService.ts`            |
| Type parameter names  | `UpperCamelCase`, short (`T`, `E`) | `Result<T, E>` |

- Interfaces are **not** prefixed with `I` in body text; the `I` prefix is
  reserved for file/name conventions in `src/services/interfaces` and
  `src/managers/interfaces` where Service/Manager types coexist with their
  contract.
- Do not encode type information in names (`list`, `map`, `Str`, `Arr`, etc.).
- Avoid abbreviations unless they are already common in the domain (`mgr` for
  manager inside a tight scope is acceptable, `lm` is not).

---

## 4. Type System

**`interface` vs `type`:**

- Object shapes → `interface`.
  ```ts
  export interface LicenseTemplate {
    name: LicenseType;
    content: string;
  }
  ```
- Unions, tuples, mapped/conditional types → `type`.
  ```ts
  export type LicenseType = StandardLicenseType | (string & {});
  export type Result<T, E = Error> = Success<T> | Failure<E>;
  ```

**No `any`.** Use `unknown` and narrow, or make the type explicit. The
`@typescript-eslint/no-explicit-any` rule is `error`.

**No `as` assertions** except `as const`. Replace with:

- Type-guarded narrowing (`instanceof Error`, type predicates).
- Explicit type annotations on the declaration site (`const x: Foo = {...}`
  instead of `{...} as Foo`).
- `satisfies` when you need both inference and a type check.

**Prefer `undefined` over `null`.** The project has one exception: the
`Result<T, E>` tuple uses `null` as the discriminator between `[T, null]`
success and `[null, E]` failure. Every other "no value" signal is `undefined`
(method return types, optional fields, uninitialized class members).

**`readonly` everywhere it applies.** Class fields set once in the constructor,
arrays that should not mutate, method parameters that are not reassigned — all
`readonly` / `ReadonlyArray<T>` / `ReadonlySet<T>`.

**Public API has explicit return types.** Exported functions and class
methods declare return types. Local helpers may rely on inference.

**Constructor parameter properties are encouraged for DI:**

```ts
constructor(
  private readonly configurationService: IConfigService,
  private readonly templateService: ITemplateService,
  private readonly fileService: IFileService,
) {}
```

No `public` modifier — that's the default.

---

## 5. Imports & Exports

- **No default exports.** Always named.
- **No `require`**. ES modules only (except config files that Node loads as
  CommonJS, e.g. `eslint.config.js`).
- Type-only imports use `import type` or the `type` modifier:
  ```ts
  import {type LicenseTemplate, type Result} from '../types';
  ```
- Side-effect imports are banned. Every module must be importable for its
  exports alone.
- Namespace imports for Node builtins and VSCode API are the only time you
  use `import * as`:
  ```ts
  import * as vscode from 'vscode';
  import * as path from 'path';
  ```
- Group imports in three blocks, separated by a blank line:
  1. Node/vscode/third-party
  2. Project absolute-ish imports (`../foo`)
  3. Sibling imports (`./bar`)

---

## 6. Error Handling

**Result-tuple pattern.** Async operations that can fail return
`Promise<Result<T, Error>>`. Use `tryCatch` to lift a throwing promise:

```ts
const [value, err] = await tryCatch(riskyPromise);
if (err) {
  error(`operation failed: ${err.message}`, err);
  return [null, err];
}
// use value
```

This keeps control flow linear and eliminates stray `throw` boundaries. The
tuple's `null` is the discriminator; this is the only place `null` is
idiomatic.

**No empty catches.** Every caught error either propagates (via `throw` or
a `Result`) or is explicitly logged with the reason the failure is safe to
swallow (e.g. best-effort filesystem cleanup).

**No silent fallbacks.** If a user-facing command cannot complete, surface
an `error(...)` toast. If a background job cannot complete, log the error
with enough context (file name, license type) to debug.

**Loggers (`info` / `warn` / `error`) are fire-and-forget.** They return
`void` and internally detach the VSCode toast promise with `void`. Never
`await` them.

---

## 7. Async

- `@typescript-eslint/no-floating-promises` is `error`. Every promise must be
  awaited, chained with `.catch`, or marked `void` on purpose.
- `tryCatch` accepts `PromiseLike<T>`, so VSCode `Thenable<T>` values flow
  through without `Promise.resolve(...)` wrappers.
- Long-running work (auto-save) guards re-entrancy with a promise-lock, not
  a flag pair (see `LicenseManager.scheduleAutoSave`).

---

## 8. Declarative & Functional Bias

Prefer lookup tables and `Array` methods over imperative switches and loops.

- Language-to-style maps live in `src/types/CommentLookup.ts` and are
  generated via `Object.fromEntries(...)`.
- Comment-style rendering (`blockPrepend`, `findCommentEnd`) dispatches
  through a `Readonly<Record<Kind, ...>>` table rather than a `switch`
  repeated in four places.
- String transforms are written as `reduce` over a `[pattern, replacement]`
  table (see `cleanLicenseContent` in `license-service.ts`).
- Array search uses `findIndex` + `slice` + `join` instead of manual index
  bookkeeping when the loop does not need early termination for performance
  reasons.

When declarative style would obscure a genuine step-by-step process (the
main auto-save pipeline), use a straight-line async function with clear
named variables instead.

---

## 9. Top-Level Functions

- Use `function` declarations for top-level helpers.
- Arrow-const form (`export const foo = () => …`) is reserved for single-
  expression callback factories inside functions. Do not use it at module
  scope.

---

## 10. Comments

- JSDoc (`/** … */`) on every exported class, interface, type, function, and
  constant whose purpose is not obvious from the name and signature.
- Implementation comments (`// …`) explain **why**, not **what**. The name
  and code explain what.
- Constants whose value embodies a design decision (`AUTO_SAVE_DEBOUNCE_MS`,
  `AUTO_CORRECTION_COOLDOWN_MS`) carry a JSDoc explaining the rationale.
- No `@author` or change-log comments — git log is the source of truth.
- No "removed X" breadcrumbs. If it's gone, delete its comment too.

---

## 11. VSCode Extension Conventions

- Commands are registered exactly once in `extension.ts` from a single
  `Record<string, () => unknown>` registry.
- `activate` returns `Promise<void>`. Failures are caught, logged, and
  surfaced via `error(...)`. The extension never throws at activation.
- `deactivate` is idempotent: it tolerates being called without an active
  `LicenseManager` and nulls the reference out after stopping.
- Command IDs match the pattern `customlicenser.<verb>` and mirror
  `package.json` `contributes.commands`. Adding a command requires updates
  in both places.
- Every configuration key declared in `package.json` must be read by
  `ConfigService`. Dead keys are a lint-by-review failure.

---

## 12. Configuration Schema Rules

- Config keys are `lowerCamelCase` (`customlicenser.authorName`).
- The canonical key list lives in `CONFIG_KEYS` (const assertion) in
  `src/constants/ConfigValues.ts`. Each key has a matching default in
  `DEFAULT_VALUES`.
- Numeric configuration values are validated on read: `ConfigService`
  rejects non-finite or out-of-range values and falls back to the default.

---

## 13. Testing

- Unit tests for pure services (`LicenseService`, `TemplateService`,
  `FileService` helpers) should not require a VSCode host.
- VSCode-integration tests live in `src/test/` and run under
  `@vscode/test-electron`.
- Test files end in `.test.ts` and colocate their expectations near the
  behavior.

_(The current repository ships only the scaffold test; filling this out
is a TODO flagged in the audit.)_

---

## 14. Commit & Review

- Every PR passes `npm run check` + `npm run lint` + `npm run build` with
  exit 0. CI should enforce these three.
- Prefer small, reviewable commits. Formatting-only changes go in their
  own commit.
- Do not commit `dist/`. It is regenerated by `npm run build`.
