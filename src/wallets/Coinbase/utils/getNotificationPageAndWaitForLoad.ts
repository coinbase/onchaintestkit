import type { BrowserContext, Page } from "@playwright/test"
import { LoadingStateDetector } from "../../../utils"

export async function getNotificationPageAndWaitForLoad(
  context: BrowserContext,
  extensionId: string,
): Promise<Page> {
  const notificationPageUrl = `chrome-extension://${extensionId}/index.html?inPageRequest=true`

  const isNotificationPage = (page: Page) =>
    page.url().includes(notificationPageUrl)

  let notificationPage = context.pages().find(isNotificationPage)

  if (!notificationPage) {
    notificationPage = await context.waitForEvent("page", {
      predicate: isNotificationPage,
    })
  }

  // Wait for DOM content to load (direct Playwright call instead of waitUntilStable)
  await notificationPage.waitForLoadState("domcontentloaded")

  // set pop-up window view port
  await notificationPage.setViewportSize({
    width: 360,
    height: 592,
  })

  // Wait for MetaMask loading indicators to disappear
  await LoadingStateDetector.waitForPageLoadingComplete(notificationPage, 10000)

  return notificationPage
}
