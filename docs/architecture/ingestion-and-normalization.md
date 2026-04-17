# Ingestion and Normalization

Status Label: Designed / Target

Truth anchors:

- [`../foundation/current-state.md`](../foundation/current-state.md)
- [`../foundation/implemented-vs-target.md`](../foundation/implemented-vs-target.md)
- [`../foundation/tech-stack-map.md`](../foundation/tech-stack-map.md)

## Current state

The current repo accepts a simplified text payload and extracts three fields:

- `role`
- `hours`
- `wage`

This is enough to demonstrate architecture boundaries, but it is not yet a real document ingestion system.

## Target ingestion surface

Target inputs should include:

- Weekly Certified Payroll PDFs
- CSV exports
- daily reports
- optional scanned images requiring OCR
- report URLs or upload references

## Target normalization contract

The ingestion layer should normalize all accepted inputs into a single typed WCP report object with:

- subcontractor and project metadata,
- week boundaries,
- employee entries,
- hours by day,
- reported base and fringe rates,
- signature evidence,
- attachment references,
- parse confidence and extraction gaps.

## Design considerations

- Raw documents should be hashed and versioned.
- OCR should be fallback, not the primary path.
- Missing or ambiguous fields should be surfaced explicitly, not silently defaulted.
- Normalization should separate extraction facts from inferred interpretations.

## Why this matters for the role

This is where retrieval and context assembly start. If ingestion is sloppy, the downstream retrieval, evals, and decision quality all degrade.
