import * as fs from 'fs'
import { RawBRD } from '../models/brd'

export async function parsePdf(filePath: string): Promise<RawBRD> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse')
  const buffer = fs.readFileSync(filePath)
  const data = await pdfParse(buffer)
  return {
    text: data.text,
    source: filePath,
    fileType: 'pdf'
  }
}
