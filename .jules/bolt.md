## 2024-04-19 - Fast Date Parsing and Sorting
**Learning:** Instantiating `new Date(str)` objects in loop or high frequency places like Array.prototype.sort or Array.prototype.reduce creates unnecessary garbage collection overhead when only sorting or calculating difference.
**Action:** ISO 8601 string dates (`a.queuedAt < b.queuedAt`) are lexicographically sortable. Use string comparison instead of `new Date()`. When calculating the time differences, use `Date.parse(str)` to get timestamp directly without Date object allocation overhead.
