import * as fs from 'fs'
import { RawBRD } from '../models/brd'

export function parseMarkdown(filePath: string): RawBRD {
  const text = fs.readFileSync(filePath, 'utf-8')
  return {
    text,
    source: filePath,
    fileType: 'markdown'
  }
}
