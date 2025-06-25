import type { Component, Chunk } from "./types.js"
import { readFile } from "fs/promises"
import { encoding_for_model } from "tiktoken" // usage for token estimation

export async function chunkComponent(component: Component, maxTokens = 120000): Promise<Chunk[]> {
  const encoder = encoding_for_model("gpt-4o")
  const chunks: Chunk[] = []
  let currentTokens: number[] = []
  let buffer: string[] = []

  const filesContent: string[] = []
  for (const file of component.files) {
    filesContent.push(await readFile(file, "utf8"))
  }

  const addChunk = () => {
    if (!buffer.length) return
    const code = buffer.join("\n")
    chunks.push({
      component,
      code,
      chunkIndex: chunks.length,
      totalChunks: 0, // placeholder
    })
    buffer = []
    currentTokens = []
  }

  for (const content of filesContent) {
    const tokens = encoder.encode(content)
    if (currentTokens.length + tokens.length > maxTokens) {
      addChunk()
    }
    buffer.push(content)
    currentTokens.push(...tokens)
  }
  addChunk()
  // update totalChunks
  for (const c of chunks) c.totalChunks = chunks.length
  return chunks
} 