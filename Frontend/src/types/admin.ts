export type Role = 'user' | 'admin'

export interface DocumentItem {
  id: number
  name: string
  category: string
  chunks: number
  uploadedBy: string
  uploadedAt: string
  status: 'Indexed' | 'Processing' | 'Needs Review'
}

export interface GraphNodeData {
  id: string
  label: string
  type: 'use-case' | 'regulation' | 'risk' | 'principle' | 'rights' | 'requirement' | 'example'
  description: string
  category: string
  connectedDocuments: string[]
  relevantPdf: string
  indexedChunks: number
  relatedConcepts: string[]
  lastUpdated: string
}
