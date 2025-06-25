import { ScannedFile } from "./scanner.js"
import { dirname } from "path"
import type { Component } from "./types.js"

/**
 * Naïve grouping: first-level folder under srcDir forms a component.
 */
export function groupComponents(files: ScannedFile[], srcDir: string): Component[] {
  const map = new Map<string, Component>()
  for (const f of files) {
    const relDir = dirname(f.path).replace(srcDir, "")
    const topLevel = relDir.split("/").filter(Boolean)[0] ?? "root"

    if (!map.has(topLevel)) {
      map.set(topLevel, { name: topLevel, files: [], weight: 0 })
    }
    const comp = map.get(topLevel)!
    comp.files.push(f.path)
    comp.weight += Math.ceil(f.content.length / 4) // rough token guess
  }
  return Array.from(map.values())
} 