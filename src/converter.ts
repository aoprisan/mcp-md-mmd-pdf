import { readFile } from 'fs/promises';
import { marked, Renderer } from 'marked';
import puppeteer from 'puppeteer';
import path from 'path';
import type { ConversionOptions, ConversionResult, MermaidConversionOptions, MermaidConversionResult } from './types.js';

/**
 * Default CSS styles for the PDF output
 */
const DEFAULT_CSS = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem;
  }

  h1, h2, h3, h4, h5, h6 {
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    font-weight: 600;
  }

  h1 { font-size: 2.5em; border-bottom: 2px solid #eee; padding-bottom: 0.3em; }
  h2 { font-size: 2em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
  h3 { font-size: 1.5em; }

  code {
    background-color: #f6f8fa;
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 0.9em;
  }

  pre {
    background-color: #f6f8fa;
    padding: 1em;
    border-radius: 6px;
    overflow-x: auto;
  }

  pre code {
    background-color: transparent;
    padding: 0;
  }

  blockquote {
    border-left: 4px solid #ddd;
    padding-left: 1em;
    color: #666;
    margin-left: 0;
  }

  table {
    border-collapse: collapse;
    width: 100%;
    margin: 1em 0;
  }

  table th, table td {
    border: 1px solid #ddd;
    padding: 0.5em;
    text-align: left;
  }

  table th {
    background-color: #f6f8fa;
    font-weight: 600;
  }

  .mermaid {
    display: flex;
    justify-content: center;
    margin: 2em 0;
  }
`;

/**
 * Converts a Markdown file with Mermaid diagrams to PDF
 */
export async function convertMarkdownToPDF(
  options: ConversionOptions
): Promise<ConversionResult> {
  try {
    // Read the markdown file
    const markdownContent = await readFile(options.inputPath, 'utf-8');

    // Configure marked with custom renderer for Mermaid diagrams
    const renderer = new Renderer();

    renderer.code = ({ text, lang, escaped }) => {
      // If this is a mermaid code block, convert it to a div with class "mermaid"
      if (lang === 'mermaid') {
        return `<div class="mermaid">\n${text}\n</div>\n`;
      }
      // For all other code blocks, use the default HTML format
      const langClass = lang ? ` class="language-${lang}"` : '';
      const code = escaped ? text : text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<pre><code${langClass}>${code}</code></pre>\n`;
    };

    marked.use({ renderer });

    // Convert markdown to HTML
    const htmlContent = await marked(markdownContent);

    // Determine output path
    const outputPath = options.outputPath ||
      path.join(
        path.dirname(options.inputPath),
        path.basename(options.inputPath, path.extname(options.inputPath)) + '.pdf'
      );

    // Create full HTML document with Mermaid support
    const fullHTML = createHTMLDocument(htmlContent, options.customCSS);

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();

      // Set content and wait for Mermaid to render
      await page.setContent(fullHTML, { waitUntil: 'networkidle0' });

      // Wait for Mermaid diagrams to be rendered
      await page.waitForFunction(
        `() => {
          const mermaidElements = document.querySelectorAll('.mermaid');
          if (mermaidElements.length === 0) return true;

          return Array.from(mermaidElements).every(el => {
            const svg = el.querySelector('svg');
            return svg !== null;
          });
        }`,
        { timeout: 30000 }
      );

      // Generate PDF
      await page.pdf({
        path: outputPath,
        format: 'A4',
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        },
        printBackground: true
      });

      return {
        success: true,
        outputPath
      };
    } finally {
      await browser.close();
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Creates a complete HTML document with Mermaid support
 */
function createHTMLDocument(bodyHTML: string, customCSS?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown to PDF</title>
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose'
    });
  </script>
  <style>
    ${DEFAULT_CSS}
    ${customCSS || ''}
  </style>
</head>
<body>
  ${bodyHTML}
</body>
</html>`;
}

/**
 * Creates a minimal HTML document with just a Mermaid diagram
 */
function createMermaidOnlyHTML(mermaidCode: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mermaid Diagram</title>
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose'
    });
  </script>
  <style>
    body {
      margin: 0;
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: white;
    }
    .mermaid {
      max-width: 100%;
    }
  </style>
</head>
<body>
  <div class="mermaid">
${mermaidCode}
  </div>
</body>
</html>`;
}

/**
 * Converts a standalone Mermaid diagram to PNG
 */
export async function convertMermaidToPNG(
  options: MermaidConversionOptions
): Promise<MermaidConversionResult> {
  try {
    // Create HTML document with just the Mermaid diagram
    const fullHTML = createMermaidOnlyHTML(options.mermaidCode);

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();

      // Set content and wait for Mermaid to render
      await page.setContent(fullHTML, { waitUntil: 'networkidle0' });

      // Wait for Mermaid diagram to be rendered
      await page.waitForFunction(
        `() => {
          const mermaidElement = document.querySelector('.mermaid');
          if (!mermaidElement) return false;
          const svg = mermaidElement.querySelector('svg');
          return svg !== null;
        }`,
        { timeout: 30000 }
      );

      // Get the rendered SVG element to determine its size
      const svgElement = await page.$('.mermaid svg');
      if (!svgElement) {
        throw new Error('Failed to render Mermaid diagram');
      }

      // Take screenshot of the SVG element
      await svgElement.screenshot({
        path: options.outputPath,
        omitBackground: false
      });

      return {
        success: true,
        outputPath: options.outputPath
      };
    } finally {
      await browser.close();
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Converts a standalone Mermaid diagram to PDF
 */
export async function convertMermaidToPDF(
  options: MermaidConversionOptions
): Promise<MermaidConversionResult> {
  try {
    // Create HTML document with just the Mermaid diagram
    const fullHTML = createMermaidOnlyHTML(options.mermaidCode);

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();

      // Set content and wait for Mermaid to render
      await page.setContent(fullHTML, { waitUntil: 'networkidle0' });

      // Wait for Mermaid diagram to be rendered
      await page.waitForFunction(
        `() => {
          const mermaidElement = document.querySelector('.mermaid');
          if (!mermaidElement) return false;
          const svg = mermaidElement.querySelector('svg');
          return svg !== null;
        }`,
        { timeout: 30000 }
      );

      // Generate PDF with appropriate sizing
      await page.pdf({
        path: options.outputPath,
        format: 'A4',
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm'
        },
        printBackground: true
      });

      return {
        success: true,
        outputPath: options.outputPath
      };
    } finally {
      await browser.close();
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
