function stripUnwantedSections(md: string): string {
  const skipHeading = /^(#{1,6})\s*(FAQ|Contributing|Error Handling)\b/i

  const lines = md.split("\n")
  const result: string[] = []
  let skipping = false

  for (const line of lines) {
    if (line.startsWith("#")) {
      if (skipHeading.test(line)) {
        skipping = true
        continue
      }
      skipping = false
    }

    if (!skipping) result.push(line)
  }

  return result.join("\n")
}

function ensureMermaidFences(md: string): string {
  const lines = md.split("\n")
  const out: string[] = []

  const mermaidStarters = [
    "flowchart",
    "sequenceDiagram",
    "classDiagram",
    "stateDiagram",
    "erDiagram",
    "gantt",
    "journey",
    "graph",
  ]

  const looksLikeMermaid = (txt: string): boolean => {
    const t = txt.trim()
    return mermaidStarters.some(s => t.startsWith(s))
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const openMatch = line.match(/^```(.*)$/)
    if (openMatch) {
      const originalLang = (openMatch[1] || "").trim()
      const blockLines: string[] = []
      let j = i + 1
      while (j < lines.length && !lines[j].startsWith("```") ) {
        blockLines.push(lines[j])
        j++
      }

      const firstContent = blockLines.find(l => l.trim().length > 0) || ""
      const isMermaid = looksLikeMermaid(firstContent)
      const langToEmit = isMermaid ? "mermaid" : originalLang

      out.push("```" + langToEmit)
      out.push(...blockLines)
      out.push("```")

      i = j // continue after closing fence (or EOF)
      continue
    }

    out.push(line)
  }

  return out.join("\n")
}

export function postProcess(md: string): string {
  const withoutJunk = stripUnwantedSections(md)
  const fixedMermaid = ensureMermaidFences(withoutJunk)
  return fixedMermaid.trim()
} 