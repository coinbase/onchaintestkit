import { writeFile, mkdir } from "fs/promises"
import { dirname, relative } from "path"
import crypto from "crypto"

export async function writeDoc(outDir: string, componentName: string, content: string) {
  const filePath = `${outDir}/${componentName}/${componentName}.mdx`
  await mkdir(dirname(filePath), { recursive: true })

  // compute content hash
  const hash = crypto.createHash("sha256").update(content).digest("hex")
  const frontMatter = `---\nsource_hash: ${hash}\n---\n\n`
  const final = frontMatter + content
  await writeFile(filePath, final, "utf8")
  console.log(`📝 wrote ${relative(process.cwd(), filePath)}`)
} 