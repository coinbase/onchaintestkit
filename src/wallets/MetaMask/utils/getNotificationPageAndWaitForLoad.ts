import { waitForMetaMaskLoad, waitUntilStable } from "./waitFor"
import type { BrowserContext, Page } from "@playwright/test"

export async function getNotificationPageAndWaitForLoad(
  context: BrowserContext,
  extensionId: string,
) {
  const notificationPageUrl = `chrome-extension://${extensionId}/notification.html`
  console.log("notificationPageUrl", notificationPageUrl)

  const isNotificationPage = (page: Page) =>
    page.url().includes(notificationPageUrl)

  let notificationPage = context.pages().find(isNotificationPage)

  if (!notificationPage) {
    notificationPage = await context.waitForEvent("page", {
      predicate: isNotificationPage,
    })
  }

  await waitUntilStable(notificationPage)

  // set pop-up window view port
  await notificationPage.setViewportSize({
    width: 360,
    height: 592,
  })

  return waitForMetaMaskLoad(notificationPage)
}
