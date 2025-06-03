import { mkdtemp } from "fs/promises"
import { join } from "path"
import { tmpdir } from "os"

export async function createTempDir(prefix: string): Promise<string> {
  return mkdtemp(join(tmpdir(), prefix))
}
