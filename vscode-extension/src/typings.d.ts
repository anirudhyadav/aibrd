declare module 'pdf-parse' {
  interface PDFData {
    numpages: number
    numrender: number
    info: Record<string, unknown>
    metadata: unknown
    version: string
    text: string
  }

  function pdfParse(buffer: Buffer): Promise<PDFData>
  export = pdfParse
}
