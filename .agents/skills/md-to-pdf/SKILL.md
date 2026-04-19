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

# Convert
pandoc input.md -o output.pdf
```

**With custom styling:**

```bash
# Using a template
pandoc input.md -o output.pdf --template=template.latex

# With specific options
pandoc input.md -o output.pdf \
  --pdf-engine=xelatex \
  -V geometry:margin=1in \
  -V fontsize=11pt
```

### Method 2: md-to-pdf (Node.js)

**Requirements**: Node.js + npm

```bash
npm install -g md-to-pdf

# Convert
md-to-pdf input.md
```

**With options:**

```bash
md-to-pdf input.md --stylesheet style.css
```

### Method 3: Python (markdown + weasyprint)

```bash
pip install markdown weasyprint

# Python script
python -c "
import markdown
from weasyprint import HTML

with open('input.md', 'r') as f:
    html = markdown.markdown(f.read())
    
HTML(string=html).write_pdf('output.pdf')
"
```

### Method 4: Browser-based (Chrome Headless)

```bash
# Convert MD to HTML first
pandoc input.md -o temp.html

# Use Chrome to print to PDF
chrome --headless --disable-gpu --print-to-pdf=output.pdf temp.html
```

## Common Use Cases

### Documentation Export

Export project documentation to PDF for distribution:

```bash
# Single file
pandoc README.md -o project-docs.pdf

# Multiple files combined
cat intro.md setup.md api.md | pandoc -o complete-docs.pdf
```

### Report Generation

Generate formatted reports with headers, footers, and styling:

```bash
pandoc report.md -o report.pdf \
  --template=report-template.latex \
  --variable=author:"Your Name" \
  --variable=date:"$(date +%Y-%m-%d)"
```

### Resume/CV

Create professional PDF resumes:

```bash
pandoc resume.md -o resume.pdf \
  --template=resume-template.latex \
  -V geometry:margin=0.5in
```

## Styling Options

### CSS for HTML-based methods

```css
/* style.css */
body {
  font-family: 'Georgia', serif;
  line-height: 1.6;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

h1, h2, h3 {
  color: #333;
  font-weight: bold;
}

code {
  background: #f4f4f4;
  padding: 2px 4px;
  border-radius: 3px;
}

pre {
  background: #f4f4f4;
  padding: 10px;
  border-radius: 5px;
  overflow-x: auto;
}
```

### LaTeX Template Variables

```bash
pandoc input.md -o output.pdf \
  -V geometry:margin=1in \
  -V fontsize=12pt \
  -V colorlinks=true \
  -V linkcolor=blue
```

## Troubleshooting

### Common Issues

**Missing LaTeX packages:**
```bash
# Install full texlive
sudo apt-get install texlive-full

# Or just the essential packages
sudo apt-get install texlive-latex-base texlive-fonts-recommended texlive-latex-extra
```

**Chinese/Unicode characters not displaying:**
```bash
# Use xelatex with fontspec
pandoc input.md -o output.pdf --pdf-engine=xelatex

# Or specify a font that supports your characters
pandoc input.md -o output.pdf -V mainfont="Noto Sans CJK SC"
```

**Images not showing:**
- Ensure image paths are relative to the markdown file
- Check that image files exist at the specified paths
- For pandoc, use absolute paths or ensure working directory is correct

### Quality Tips

1. **For best typography**: Use LaTeX/Pandoc
2. **For fastest conversion**: Use md-to-pdf (Node.js)
3. **For programmatic conversion**: Use Python (weasyprint)
4. **For web-based automation**: Use Chrome headless

## Advanced: Custom Templates

### LaTeX Template

Create `custom-template.latex`:

```latex
\documentclass[11pt]{article}
\usepackage[margin=1in]{geometry}
\usepackage{hyperref}
\usepackage{graphicx}

\begin{document}
$body$
\end{document}
```

Use with:
```bash
pandoc input.md -o output.pdf --template=custom-template.latex
```

### HTML Template

Create `custom-template.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; }
  </style>
</head>
<body>
  $body$
</body>
</html>
```

Use with Chrome headless or weasyprint for PDF generation.
