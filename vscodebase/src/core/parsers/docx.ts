import * as fs from 'fs'
import { RawBRD } from '../models/brd'

export async function parseDocx(filePath: string): Promise<RawBRD> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mammoth = require('mammoth')
  const buffer = fs.readFileSync(filePath)
  const result = await mammoth.extractRawText({ buffer })
  return {
    text: result.value,
    source: filePath,
    fileType: 'docx'
  }
}
