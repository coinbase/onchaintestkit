import type { Chunk } from "./types.js"

export function buildPrompt(chunk: Chunk, projectReadme?: string): { system: string; user: string } {
  const system = `You are an expert technical writer. Generate high-quality, detailed MDX documentation for the provided code. Include:
• A detailed description of the component.
• A list of all the functions and their descriptions.
• A list of all the variables and their descriptions.
• A list of all the events and their descriptions.
• This is going to be published as an NPM package, so use this npm package name in the documentation: @coinbase/onchaintestkit when writing examples. 
• Use the readme file as a reference for what the project does.
• Mermaid diagrams when they add clarity.
• API tables and illustrative example snippets.
• Do NOT add sections titled FAQ, Contributing, or Error Handling, anything related to npm or yarn. Only include the component documentation, examples to use it, and the API reference. There also needs to be a detailed overview on what the component is and why it is important.
• Model the docs after open source projects like apache spark, apache trino, etc.

Use GitHub-compatible Mermaid and heading conventions.`

  const header = chunk.totalChunks > 1 ? `Part ${chunk.chunkIndex + 1}/${chunk.totalChunks}` : ``
  const intro = projectReadme && chunk.chunkIndex === 0 ? `${projectReadme}\n\n` : ""
  const user = `${header}\n\n${intro}\u0060\u0060\u0060\n${chunk.code}\n\u0060\u0060\u0060`
  return { system, user }
} 