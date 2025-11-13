# Markdown + Mermaid to PDF MCP Server

An MCP (Model Context Protocol) server that converts Markdown files containing Mermaid diagrams into PDF documents, and also converts standalone Mermaid diagrams to PNG or PDF. The server uses a hybrid approach: converting Markdown to HTML, rendering Mermaid diagrams as SVG graphics, and then generating outputs using Puppeteer.

## Features

- Converts Markdown files with Mermaid diagrams to PDF
- Converts standalone Mermaid diagram code to PNG images
- Converts standalone Mermaid diagram code to PDF files
- Automatically renders Mermaid diagrams as high-quality SVG graphics
- Clean, professional default styling
- Support for custom CSS styling (for Markdown conversion)
- Simple MCP tool interface

## Installation

```bash
npm install
npm run build
```

## Usage

### As an MCP Server

Add this server to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "md-mmd-pdf": {
      "command": "node",
      "args": ["/absolute/path/to/md-mmd-pdf/build/index.js"]
    }
  }
}
```

### Tool: `convert_md_to_pdf`

Converts a Markdown file with Mermaid diagrams to PDF.

**Parameters:**
- `input_path` (required): Absolute path to the input Markdown file
- `output_path` (optional): Absolute path where the PDF should be saved. If not provided, uses the same name as input with `.pdf` extension
- `custom_css` (optional): Additional CSS styles to apply to the PDF

**Example:**
```json
{
  "input_path": "/path/to/document.md",
  "output_path": "/path/to/output.pdf"
}
```

### Tool: `convert_mermaid_to_png`

Converts a standalone Mermaid diagram code to a PNG image file.

**Parameters:**
- `mermaid_code` (required): Raw Mermaid diagram code as a string
- `output_path` (required): Absolute path where the PNG file should be saved

**Example:**
```json
{
  "mermaid_code": "graph TD\n  A[Start] --> B[Process]\n  B --> C[End]",
  "output_path": "/path/to/diagram.png"
}
```

### Tool: `convert_mermaid_to_pdf`

Converts a standalone Mermaid diagram code to a PDF file.

**Parameters:**
- `mermaid_code` (required): Raw Mermaid diagram code as a string
- `output_path` (required): Absolute path where the PDF file should be saved

**Example:**
```json
{
  "mermaid_code": "sequenceDiagram\n  Alice->>Bob: Hello\n  Bob->>Alice: Hi!",
  "output_path": "/path/to/diagram.pdf"
}
```

## How It Works

1. **Markdown Parsing**: Reads and parses Markdown content using the `marked` library
2. **HTML Generation**: Converts Markdown to HTML while preserving Mermaid code blocks
3. **Mermaid Rendering**: Injects Mermaid.js library to render diagrams as SVG in the browser
4. **PDF Export**: Uses Puppeteer (headless Chrome) to generate the final PDF with all content rendered

## Example Markdown

See `example.md` for a sample document with Mermaid diagrams.

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode for development
npm run dev

# Run the server
npm start
```

## Requirements

- Node.js 18 or higher
- Sufficient memory for Puppeteer to run headless Chrome

## License

MIT
