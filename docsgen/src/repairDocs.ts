import { readdir, readFile, writeFile, stat } from "fs/promises"
import { join, extname } from "path"
import { pathToFileURL } from "url"

const diagramStarters = [
  "flowchart",
  "sequenceDiagram",
  "classDiagram",
  "stateDiagram",
  "stateDiagram-v2",
  "erDiagram",
  "gantt",
  "journey",
  "graph",
]

function looksLikeDiagram(firstLine: string): boolean {
  const t = firstLine.trim()
  return diagramStarters.some(s => t.startsWith(s))
}

function relabelBlock(lang: string, content: string[]): string {
  if (lang === "mermaid" && !looksLikeDiagram(content.find(l => l.trim()) || "")) {
    // decide language heuristically
    const first = content.find(l => l.trim()) || ""
    if (first.startsWith("pragma solidity") || first.startsWith("contract")) return "solidity"
    if (first.startsWith("import") || first.includes("=>")) return "ts"
    if (first.startsWith("forge")) return "sh"
    return "" // plain fence
  }
  return lang
}

async function fixFile(path: string) {
  const md = await readFile(path, "utf8")
  const lines = md.split("\n")
  const out: string[] = []
  for (let i = 0; i < lines.length; i++) {
    const openMatch = lines[i].match(/^```(.*)$/)
    if (openMatch) {
      const originalLang = (openMatch[1] || "").trim()
      const block: string[] = []
      let j = i + 1
      while (j < lines.length && !lines[j].startsWith("```")) {
        block.push(lines[j])
        j++
      }
      const newLang = relabelBlock(originalLang, block)
      out.push("```" + newLang)
      out.push(...block)
      out.push("```")
      i = j
    } else {
      out.push(lines[i])
    }
  }
  await writeFile(path, out.join("\n"), "utf8")
  console.log("🔧 fixed", path)
}

async function* walk(dir: string): AsyncGenerator<string> {
  for (const entry of await readdir(dir)) {
    const p = join(dir, entry)
    const s = await stat(p)
    if (s.isDirectory()) {
      yield* walk(p)
    } else if (extname(p) === ".mdx") {
      yield p
    }
  }
}

export async function repairDocs(root: string) {
  for await (const file of walk(root)) {
    await fixFile(file)
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dir = process.argv[2]
  if (!dir) {
    console.error("usage: node repairDocs.js <docsDir>")
    process.exit(1)
  }
  repairDocs(dir).catch(err => {
    console.error(err)
    process.exit(1)
  })
} 