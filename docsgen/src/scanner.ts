import fg from "fast-glob"
import { readFile } from "fs/promises"

export type ScannedFile = {
  path: string
  content: string
  size: number // bytes
}

export async function scanFiles(srcDir: string): Promise<ScannedFile[]> {
  const entries = await fg(["**/*.{ts,tsx,js,jsx,sol}", "!**/*.d.ts"], {
    cwd: srcDir,
    absolute: true,
    ignore: ["node_modules", "dist", "build", "coverage", "docs", "test", "tests", "tests/**", "test/**", "tests/*", "test/*"],
  })
  const files: ScannedFile[] = []
  for (const p of entries) {
    const content = await readFile(p, "utf8")
    files.push({ path: p, content, size: content.length })
  }
  return files
} 