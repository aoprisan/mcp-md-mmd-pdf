#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { convertMarkdownToPDF, convertMermaidToPNG, convertMermaidToPDF } from './converter.js';
import type { ConversionOptions, MermaidConversionOptions } from './types.js';

/**
 * MCP Server for converting Markdown files with Mermaid diagrams to PDF
 */
class MarkdownMermaidPDFServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'md-mmd-pdf-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'convert_md_to_pdf',
          description:
            'Converts a Markdown file containing Mermaid diagrams to a PDF file. ' +
            'The Mermaid diagrams will be rendered as SVG graphics in the final PDF.',
          inputSchema: {
            type: 'object',
            properties: {
              input_path: {
                type: 'string',
                description: 'Absolute path to the input Markdown file',
              },
              output_path: {
                type: 'string',
                description:
                  'Absolute path where the PDF should be saved (optional). ' +
                  'If not provided, will use the same name as input file with .pdf extension.',
              },
              custom_css: {
                type: 'string',
                description:
                  'Custom CSS styles to apply to the PDF (optional). ' +
                  'This will be added in addition to the default styling.',
              },
            },
            required: ['input_path'],
          },
        },
        {
          name: 'convert_mermaid_to_png',
          description:
            'Converts a standalone Mermaid diagram code to a PNG image file. ' +
            'Provide the raw Mermaid diagram code and specify where to save the PNG.',
          inputSchema: {
            type: 'object',
            properties: {
              mermaid_code: {
                type: 'string',
                description: 'Raw Mermaid diagram code (e.g., "graph TD\\n  A-->B")',
              },
              output_path: {
                type: 'string',
                description: 'Absolute path where the PNG file should be saved',
              },
            },
            required: ['mermaid_code', 'output_path'],
          },
        },
        {
          name: 'convert_mermaid_to_pdf',
          description:
            'Converts a standalone Mermaid diagram code to a PDF file. ' +
            'Provide the raw Mermaid diagram code and specify where to save the PDF.',
          inputSchema: {
            type: 'object',
            properties: {
              mermaid_code: {
                type: 'string',
                description: 'Raw Mermaid diagram code (e.g., "graph TD\\n  A-->B")',
              },
              output_path: {
                type: 'string',
                description: 'Absolute path where the PDF file should be saved',
              },
            },
            required: ['mermaid_code', 'output_path'],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name === 'convert_md_to_pdf') {
        const args = request.params.arguments as {
          input_path?: string;
          output_path?: string;
          custom_css?: string;
        };

        if (!args.input_path) {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: input_path is required',
              },
            ],
            isError: true,
          };
        }

        const options: ConversionOptions = {
          inputPath: args.input_path,
          outputPath: args.output_path,
          customCSS: args.custom_css,
        };

        const result = await convertMarkdownToPDF(options);

        if (result.success) {
          return {
            content: [
              {
                type: 'text',
                text: `Successfully converted Markdown to PDF!\nOutput: ${result.outputPath}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Conversion failed: ${result.error}`,
              },
            ],
            isError: true,
          };
        }
      }

      if (request.params.name === 'convert_mermaid_to_png') {
        const args = request.params.arguments as {
          mermaid_code?: string;
          output_path?: string;
        };

        if (!args.mermaid_code || !args.output_path) {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: mermaid_code and output_path are required',
              },
            ],
            isError: true,
          };
        }

        const options: MermaidConversionOptions = {
          mermaidCode: args.mermaid_code,
          outputPath: args.output_path,
        };

        const result = await convertMermaidToPNG(options);

        if (result.success) {
          return {
            content: [
              {
                type: 'text',
                text: `Successfully converted Mermaid diagram to PNG!\nOutput: ${result.outputPath}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Conversion failed: ${result.error}`,
              },
            ],
            isError: true,
          };
        }
      }

      if (request.params.name === 'convert_mermaid_to_pdf') {
        const args = request.params.arguments as {
          mermaid_code?: string;
          output_path?: string;
        };

        if (!args.mermaid_code || !args.output_path) {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: mermaid_code and output_path are required',
              },
            ],
            isError: true,
          };
        }

        const options: MermaidConversionOptions = {
          mermaidCode: args.mermaid_code,
          outputPath: args.output_path,
        };

        const result = await convertMermaidToPDF(options);

        if (result.success) {
          return {
            content: [
              {
                type: 'text',
                text: `Successfully converted Mermaid diagram to PDF!\nOutput: ${result.outputPath}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Conversion failed: ${result.error}`,
              },
            ],
            isError: true,
          };
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `Unknown tool: ${request.params.name}`,
          },
        ],
        isError: true,
      };
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Markdown Mermaid PDF MCP server running on stdio');
  }
}

// Start the server
const server = new MarkdownMermaidPDFServer();
server.run().catch(console.error);
