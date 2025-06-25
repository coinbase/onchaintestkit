import { ConditionWatcher } from "../../../utils"
import type { Locator } from "@playwright/test"

export async function toggle(toggleLocator: Locator) {
  const classes = await toggleLocator.getAttribute("class", { timeout: 3_000 })

  if (!classes) {
    throw new Error("[ToggleShowTestNetworks] Toggle class returned null")
  }

  const isOn = classes.includes("toggle-button--on")

  await toggleLocator.click()

  const waitForAction = async (): Promise<boolean | null> => {
    const updatedClasses = await toggleLocator.getAttribute("class")

    if (!updatedClasses) {
      throw new Error(
        "[ToggleShowTestNetworks] Toggle class returned null inside ConditionWatcher",
      )
    }

    if (isOn) {
      return updatedClasses.includes("toggle-button--off") ? true : null
    }

    return updatedClasses.includes("toggle-button--on") ? true : null
  }

  await ConditionWatcher.waitForCondition(
    waitForAction,
    3_000,
    "toggle state change",
  )
}
