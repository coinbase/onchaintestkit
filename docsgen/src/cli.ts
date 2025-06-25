#!/usr/bin/env node
import { Command } from "commander"
import { scanFiles } from "./scanner.js"
import { groupComponents } from "./grouper.js"
import { chunkComponent } from "./chunker.js"
import { buildPrompt } from "./promptBuilder.js"
import { LlmClient } from "./llmClient.js"
import { postProcess } from "./postProcess.js"
import { writeDoc } from "./docWriter.js"
import { DocsGenConfig } from "./types.js"
import { resolve } from "path"
import { readFile } from "fs/promises"

const program = new Command()

program
  .name("octk-docsgen")
  .option("-s, --src-dir <dir>", "Source directory", "src")
  .option("-o, --out-dir <dir>", "Output directory", "docs")
  .option("--openai-key <key>", "OpenAI API key", process.env.OPENAI_API_KEY)
  .option("-m, --model <name>", "OpenAI model", "gpt-4.1")
  .option("-r, --readme-path <file>", "Path to project README", "README.md")
  .option("--max-in-tokens <n>", "Max input tokens per chunk", "240000")
  .option("--max-out-tokens <n>", "Max output tokens per request", "32000")
  .parse(process.argv)

async function main() {
  const opts = program.opts<DocsGenConfig>()
  if (!opts.openaiKey) {
    console.error("OPENAI_API_KEY required")
    process.exit(1)
  }
  const srcAbs = resolve(opts.srcDir)
  let readme = ""
  try {
    readme = await readFile(resolve(opts.readmePath ?? ""), "utf8")
  } catch {
    // README not found; continue without it
  }
  const files = await scanFiles(srcAbs)
  const comps = groupComponents(files, srcAbs)
  const client = new LlmClient(opts.openaiKey, opts.model, Number(opts.maxOutTokens))

  for (const comp of comps) {
    const chunks = await chunkComponent(comp, Number(opts.maxInTokens))
    let md = ""
    for (const chunk of chunks) {
      const { system, user } = buildPrompt(chunk, chunk.chunkIndex === 0 ? readme : undefined)
      const part = await client.chat(system, user)
      md += part + "\n\n"
    }
    const processed = postProcess(md)
    await writeDoc(opts.outDir, comp.name, processed)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
}) 