declare module 'pdf-parse' {
  const pdfParse: (buffer: Buffer) => Promise<{ text: string; numpages?: number }>
  export default pdfParse
}

declare module 'pdfjs-dist/build/pdf.mjs' {
  const content: any
  export = content
}

