export type Component = {
  name: string
  files: string[]
  weight: number // token estimate
}

export type Chunk = {
  component: Component
  code: string
  chunkIndex: number
  totalChunks: number
}

export interface DocsGenConfig {
  outDir: string
  srcDir: string
  openaiKey: string
  componentGlobs?: Record<string, string[]> // optional explicit mapping
  maxTokens?: number // defaults to 90000 for safety
  readmePath?: string
  maxInTokens?: number
  maxOutTokens?: number
  /**
   * OpenAI model name to use, e.g. "gpt-4o-2024-05-13" or "gpt-4o-mini".
   * Optional because we provide a default in the CLI layer.
   */
  model?: string
} 