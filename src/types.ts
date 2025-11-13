/**
 * Options for converting Markdown to PDF
 */
export interface ConversionOptions {
  /** Path to the input Markdown file */
  inputPath: string;
  /** Path where the PDF should be saved (optional, defaults to same name as input with .pdf extension) */
  outputPath?: string;
  /** CSS styles to apply to the HTML before PDF conversion (optional) */
  customCSS?: string;
}

/**
 * Result of a conversion operation
 */
export interface ConversionResult {
  /** Whether the conversion was successful */
  success: boolean;
  /** Path to the generated PDF file */
  outputPath?: string;
  /** Error message if conversion failed */
  error?: string;
}

/**
 * Options for converting standalone Mermaid diagram to PNG or PDF
 */
export interface MermaidConversionOptions {
  /** Raw Mermaid diagram code */
  mermaidCode: string;
  /** Path where the output file should be saved */
  outputPath: string;
}

/**
 * Result of a Mermaid diagram conversion operation
 */
export interface MermaidConversionResult {
  /** Whether the conversion was successful */
  success: boolean;
  /** Path to the generated output file */
  outputPath?: string;
  /** Error message if conversion failed */
  error?: string;
}
