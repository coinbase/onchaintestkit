import type { BrowserContext, Page } from "@playwright/test"

export async function getNotificationPageAndWaitForLoad(
  context: BrowserContext,
  extensionId: string,
): Promise<Page> {
  const notificationPageUrl = `chrome-extension://${extensionId}/index.html?inPageRequest=true`
  console.log("notificationPageUrl", notificationPageUrl)

  const isNotificationPage = (page: Page) =>
    page.url().includes(notificationPageUrl)

  let notificationPage = context.pages().find(isNotificationPage)

  if (!notificationPage) {
    notificationPage = await context.waitForEvent("page", {
      predicate: isNotificationPage,
    })
  }

  // set pop-up window view port
  await notificationPage.setViewportSize({
    width: 360,
    height: 592,
  })

  // Wait for page to be ready
  await notificationPage.waitForLoadState("networkidle")

  return notificationPage
}
