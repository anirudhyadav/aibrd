export type FileType = 'pdf' | 'docx' | 'markdown'

export interface RawBRD {
  text: string
  source: string
  fileType: FileType
}

export interface BRDChunk {
  text: string
  index: number
  total: number
  moduleHint?: string
}
