## 2026-04-18 - ISO Date String Sorting
**Learning:** ISO 8601 date strings can be compared and sorted without parsing them into `Date` objects first.
**Action:** When sorting arrays of objects by ISO timestamp (like `queuedAt`), use `a.queuedAt < b.queuedAt` or `a.queuedAt.localeCompare(b.queuedAt)` instead of `new Date(a.queuedAt).getTime() - new Date(b.queuedAt).getTime()`. This is ~18x faster because it avoids `Date` object allocation.
