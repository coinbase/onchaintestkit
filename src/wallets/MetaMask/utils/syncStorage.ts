import type { BrowserContext } from "@playwright/test"

type StorageData = {
  origin: string
  data: { key: string; value: string }[]
}

export async function syncStorage(
  storageData: StorageData[],
  context: BrowserContext,
): Promise<void> {
  const page = await context.newPage()

  for (const { origin, data } of storageData) {
    await page.goto(origin)

    await page.evaluate(items => {
      items.forEach(({ key, value }) => {
        window.localStorage.setItem(key, value)
      })
    }, data)
  }

  await page.close()
}
