# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server that converts Markdown files containing Mermaid diagrams into PDF documents, and also converts standalone Mermaid diagrams to PNG or PDF. The server uses Puppeteer (headless Chrome) to render HTML with embedded Mermaid.js diagrams and generate output files.

## Build and Development Commands

```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript (output: build/ directory)
npm run build

# Development mode with watch (auto-rebuild on changes)
npm run dev

# Run the MCP server (must build first)
npm start

# Or run directly after building
node build/index.js
```

## Architecture

### MCP Server Structure

The codebase follows a clean separation of concerns:

- **src/index.ts**: MCP server implementation using `@modelcontextprotocol/sdk`
  - Defines the `MarkdownMermaidPDFServer` class that handles MCP protocol
  - Exposes three tools: `convert_md_to_pdf`, `convert_mermaid_to_png`, `convert_mermaid_to_pdf`
  - Uses stdio transport for communication with MCP clients
  - Handles tool invocation requests and returns structured responses

- **src/converter.ts**: Core conversion logic
  - `convertMarkdownToPDF()`: Reads Markdown, converts to HTML using `marked`, wraps in HTML template with Mermaid.js CDN import, renders with Puppeteer, exports to PDF
  - `convertMermaidToPNG()`: Creates minimal HTML with single Mermaid diagram, waits for SVG rendering, takes screenshot
  - `convertMermaidToPDF()`: Similar to PNG but exports as PDF with A4 formatting
  - All functions use Puppeteer's `waitForFunction()` to ensure Mermaid diagrams are fully rendered (checking for `<svg>` elements) before export
  - Default CSS styling is defined here (`DEFAULT_CSS`)

- **src/types.ts**: TypeScript interfaces for options and results

### Key Technical Details

**Mermaid Rendering Process:**
1. HTML is created with a Mermaid code block in a `<div class="mermaid">` element
2. Mermaid.js is loaded from CDN as ES module (`mermaid@11`)
3. Puppeteer waits for `networkidle0` to ensure scripts load
4. Custom `waitForFunction()` checks that all `.mermaid` elements have rendered `<svg>` children
5. Only after SVG rendering is complete does the conversion proceed

**Puppeteer Configuration:**
- Always runs headless with `--no-sandbox` and `--disable-setuid-sandbox` args
- 30-second timeout for Mermaid rendering
- PDF exports use A4 format with configurable margins
- PNG exports screenshot the specific SVG element (not full page)

**TypeScript Configuration:**
- Target: ES2022 with Node16 module resolution
- Outputs to `build/` directory with source maps and declarations
- Strict mode enabled

## MCP Client Configuration

To use this server with Claude Desktop or another MCP client:

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

## Tool Parameters

All three tools require **absolute paths** (not relative):

- `convert_md_to_pdf`: input_path (required), output_path (optional), custom_css (optional)
- `convert_mermaid_to_png`: mermaid_code (required), output_path (required)
- `convert_mermaid_to_pdf`: mermaid_code (required), output_path (required)

## Common Development Patterns

**Adding a new export format:**
1. Add a new tool definition in `src/index.ts` `ListToolsRequestSchema` handler
2. Implement the conversion function in `src/converter.ts` (follow existing pattern)
3. Add handler case in `CallToolRequestSchema` in `src/index.ts`
4. Define types in `src/types.ts` if needed

**Modifying PDF styling:**
- Edit `DEFAULT_CSS` constant in `src/converter.ts`
- Users can override/extend via `custom_css` parameter (only for Markdown conversion)

**Debugging Mermaid rendering issues:**
- Increase timeout in `waitForFunction()` calls (currently 30s)
- Check Mermaid.js initialization options in `createHTMLDocument()` or `createMermaidOnlyHTML()`
- Consider adjusting `securityLevel` if diagrams fail to render
