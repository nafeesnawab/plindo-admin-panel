# UI Refactor & Code Cleanup Workflow

> Use this workflow when a page or component needs design fixes, dark mode support, and code refactoring.

---

## Step 1: Research the Target

Before touching any code:

1. Read the target file(s) completely
2. Read nearby components in the same folder to understand existing patterns
3. Check the design system at `src/styles/design-system.css` (if exists) or `src/theme/` for color tokens
4. Look at 2-3 similar pages that are already well-built — match their style exactly
5. Count the lines — if any file is over 200 lines, it MUST be split

---

## Step 2: Dark Mode Audit

Scan every file for these dark mode violations and fix ALL of them:

### Never use hardcoded light-only colors

```
BAD:  bg-green-100 text-green-800
GOOD: bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300

BAD:  bg-gray-100 text-gray-800
GOOD: bg-gray-50 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400

BAD:  bg-blue-100 text-blue-800 border-blue-200
GOOD: bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800
```

### Use semantic Tailwind classes that auto-adapt

```
text-foreground          (auto light/dark)
text-muted-foreground    (auto light/dark)
bg-background            (auto light/dark)
bg-muted                 (auto light/dark)
bg-card                  (auto light/dark)
border-border            (auto light/dark)
bg-primary               (auto light/dark)
text-primary             (auto light/dark)
text-destructive         (auto light/dark)
```

### Badge pattern for dark mode

Every colored badge needs BOTH light and dark variants:

```tsx
// Status badge
className={cn(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border",
  status === "active"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
    : "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800/40 dark:text-gray-400 dark:border-gray-700",
)}
```

### Borders

```
BAD:  border-gray-200
GOOD: border-border
```

---

## Step 3: Refactor Large Files

### Rules

- Components: MAX 200 lines
- Pages: MAX 250 lines
- Hooks: MAX 150 lines
- Utils: MAX 100 lines per function

### How to Split

```
src/pages/feature/
├── index.tsx                    # Main page — composition only (<250 lines)
├── types.ts                     # Types, interfaces, constants
├── hooks/
│   ├── use-feature-data.ts      # Data fetching, CRUD operations
│   └── use-feature-form.ts      # Form state management (if form exists)
├── components/
│   ├── feature-toolbar.tsx       # Search, filters
│   ├── feature-table.tsx         # Table/list with pagination
│   ├── feature-form-dialog.tsx   # Create/edit dialog
│   └── delete-dialog.tsx         # Delete confirmation
```

### What goes where

| Extract to | When |
|---|---|
| `types.ts` | Types, interfaces, constants, config objects, pure utility functions |
| `hooks/use-*.ts` | State management, API calls, side effects, complex logic |
| `components/*.tsx` | Any JSX block over 50 lines, anything with its own state, anything reusable |
| Page `index.tsx` | ONLY composition — import components, wire props, render layout |

### The index.tsx pattern

```tsx
// index.tsx should look like this — just composition, no business logic
export default function FeaturePage() {
  const data = useFeatureData();
  const form = useFeatureForm();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div>
      <Header />
      <Toolbar />
      <Table />
      <FormDialog />
      <DeleteDialog />
    </div>
  );
}
```

---

## Step 4: Design Consistency

### Spacing

- Page gap: `gap-6` between major sections
- Card padding: `p-4` or `p-5`
- Form field gaps: `gap-3` between fields
- Button gaps: `gap-2` for icon + text

### Typography

- Page title: `text-2xl font-bold tracking-tight`
- Page subtitle: `text-sm text-muted-foreground`
- Section headers: `font-semibold text-base`
- Table text: `text-sm`
- Labels: `text-xs text-muted-foreground`

### Cards

```tsx
<Card>
  <CardContent className="p-5">
    {/* content */}
  </CardContent>
</Card>
```

### Stat cards (if page has stats)

```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <Card>
    <CardContent className="flex items-center gap-3 p-4">
      <div className="rounded-lg bg-muted p-2.5">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </CardContent>
  </Card>
</div>
```

### Tables

- Wrap in scrollable container: `overflow-auto max-h-[calc(100vh-340px)]`
- Sticky header: `sticky top-0 z-10 bg-muted/80 backdrop-blur-sm`
- Row hover: `group` on row, show actions on `group-hover:opacity-100`
- Always include pagination for lists that can grow

### Pagination pattern

```tsx
<div className="flex items-center justify-between pt-4">
  <div className="flex items-center gap-2 text-sm text-muted-foreground">
    <span>Rows per page</span>
    <Select value={perPage} onValueChange={setPerPage}>
      {[10, 25, 50].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
    </Select>
  </div>
  <div className="flex items-center gap-2">
    <span className="text-sm text-muted-foreground">{start}-{end} of {total}</span>
    <Button variant="outline" size="icon" className="h-8 w-8" disabled={page===1}>
      <ChevronLeft className="h-4 w-4" />
    </Button>
    <Button variant="outline" size="icon" className="h-8 w-8" disabled={page===last}>
      <ChevronRight className="h-4 w-4" />
    </Button>
  </div>
</div>
```

### Empty states

```tsx
<div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
  <Icon className="h-10 w-10 mb-3 opacity-40" />
  <p className="text-sm font-medium">No items found</p>
  <p className="text-xs mt-1">Create your first item to get started</p>
</div>
```

---

## Step 5: Code Quality Checklist

Before finishing, verify:

- [ ] Every file under 200 lines (components) / 250 lines (pages)
- [ ] One responsibility per file
- [ ] No `any` types
- [ ] No hardcoded colors without `dark:` variant
- [ ] All badges work in dark mode
- [ ] All borders use `border-border` or have `dark:` variant
- [ ] Imports follow project order (React → Third-party → UI → Components → Hooks → Store → Utils → Types → Local)
- [ ] No `console.log`
- [ ] No commented-out code
- [ ] Tables have pagination
- [ ] Tables have scrollable body (not full-page scroll)
- [ ] Loading state handled (spinner)
- [ ] Empty state handled (icon + message)
- [ ] TypeScript build passes (`npx tsc --noEmit`)

---

## Execution Order

1. Read target files + nearby components for context
2. Fix all dark mode issues first (quick wins)
3. Split large files into folder structure
4. Extract types/constants → `types.ts`
5. Extract data logic → `hooks/use-*.ts`
6. Extract UI sections → `components/*.tsx`
7. Rewrite `index.tsx` as pure composition
8. Add pagination to tables if missing
9. Make tables scroll independently (not full page)
10. Run `npx tsc --noEmit` to verify
11. Visual check: light mode + dark mode
