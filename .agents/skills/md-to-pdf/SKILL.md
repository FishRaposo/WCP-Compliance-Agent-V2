---
name: md-to-pdf
description: Convert Markdown documents to PDF format. Use when the user needs to transform .md files into .pdf, including documentation export, report generation, or document sharing. Supports multiple conversion methods from simple to advanced formatting needs.
---

# Markdown to PDF Conversion

Convert Markdown documents to PDF with various formatting options.

## Quick Start

### Method 1: Pandoc (Recommended for Complex Documents)

**Requirements**: pandoc + LaTeX

```bash
# Ubuntu/Debian
sudo apt-get install pandoc texlive-latex-base texlive-fonts-recommended

# macOS
brew install pandoc basictex
```

**Basic conversion**:
```bash
pandoc input.md -o output.pdf
```

**With Chinese support**:
```bash
pandoc input.md -o output.pdf --pdf-engine=xelatex -V CJKmainfont="Noto Sans CJK SC"
```

**With custom CSS (via HTML)**:
```bash
pandoc input.md -o output.pdf --css=style.css
```

### Method 2: Python Script (No LaTeX Required)

Use the bundled script for lightweight conversion:

```bash
python scripts/md2pdf.py input.md output.pdf
```

**Features**:
- No LaTeX installation needed
- Basic markdown support
- Faster for simple documents

## Method Selection Guide

| Need | Method | Why |
|------|--------|-----|
| Chinese/Asian languages | Pandoc + xelatex | Font support |
| Math equations | Pandoc + LaTeX | KaTeX/MathJax rendering |
| Code highlighting | Pandoc | Pygments integration |
| Quick & simple | Python script | Fast, no deps |
| Custom styling | Playwright | Full CSS control |
| Batch processing | Python script | Easy to automate |

## Troubleshooting

**Chinese characters showing as squares?**
- Use xelatex engine with CJK font
- Install fonts: `sudo apt-get install fonts-noto-cjk`

**LaTeX not found?**
- Install: `sudo apt-get install texlive-full` (large) or `texlive-latex-base` (minimal)

**Images not appearing?**
- Use absolute paths or ensure images are in working directory
- Check image format (PNG/JPG work best)
