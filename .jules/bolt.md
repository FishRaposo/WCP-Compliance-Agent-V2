<<<<<<< HEAD
<<<<<<< HEAD
## 2025-05-19 - [Date parsing performance anti-pattern in array loops]
 **Learning:** Discovered an anti-pattern of using `new Date(string).getTime()` to parse ISO 8601 strings during array `.sort` and `.reduce` methods inside `src/services/human-review-queue.ts`. Creating a full `Date` object each iteration in tight loops causes unnecessary memory allocation overhead. Additionally, ISO 8601 strings are strictly lexicographically sortable, so when only comparison is needed in sort comparators, direct string comparison (`a < b`) is significantly faster.
 **Action:** For sorting ISO 8601 string dates, always use direct string comparison `<` / `>`. For extracting timestamps for calculation without needing a Date object, prefer `Date.parse(dateString)` instead of `new Date(dateString).getTime()`.
=======
## 2025-04-20 - Date object allocation bottleneck in array sorting and iterations

**Learning:** When sorting or reducing over arrays of ISO 8601 string dates (e.g., `listPending` or `getStats` in queue services), doing `new Date(string).getTime()` creates unnecessary intermediate `Date` objects inside loops, causing significant GC pressure and performance slowdowns (~60x slower in benchmarks).
**Action:** Use direct string comparison (`a < b ? -1 : a > b ? 1 : 0`) for sorting lexicographically correct ISO 8601 strings, and `Date.parse(string)` when only the timestamp numeric value is needed for math.
>>>>>>> origin/jules-bolt-perf-optimization-5862459989937235893
=======
## 2024-04-19 - Fast Date Parsing and Sorting
**Learning:** Instantiating `new Date(str)` objects in loop or high frequency places like Array.prototype.sort or Array.prototype.reduce creates unnecessary garbage collection overhead when only sorting or calculating difference.
**Action:** ISO 8601 string dates (`a.queuedAt < b.queuedAt`) are lexicographically sortable. Use string comparison instead of `new Date()`. When calculating the time differences, use `Date.parse(str)` to get timestamp directly without Date object allocation overhead.
>>>>>>> origin/bolt-performance-optimizations-13650152548077798304
