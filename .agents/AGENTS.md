# Workspace Rules

1. **Automatic Error Check After Code Modification**:
   - Every time code is added, modified, or refactored, run `npx tsc --noEmit` to check for TypeScript type errors or syntax issues.
   - Resolve any identified errors immediately before concluding the task.
2. **Type Safety**:
   - Avoid using `any` types. Always define proper TypeScript interfaces or types.
