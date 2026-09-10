import { expect, test } from '@playwright/test'

for (const viewport of [{ width: 430, height: 932 }, { width: 375, height: 667 }, { width: 360, height: 800 }]) {
  test(`drawer dismissal and keyboard focus at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('./services')
    const trigger = page.getByRole('button', { name: 'Open navigation menu' })
    const drawer = page.getByRole('navigation', { name: 'Mobile navigation', exact: true })
    const bottom = page.getByRole('navigation', { name: 'Mobile primary navigation' })
    const initialBottom = await bottom.boundingBox()
    await trigger.click()
    const close = drawer.getByRole('button', { name: 'Close navigation menu' })
    await expect(close).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(drawer.getByRole('link', { name: 'Email', exact: true })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(close).toBeFocused()
    for (let index = 0; index < 9; index += 1) {
      await page.keyboard.press('Tab')
      expect(await drawer.evaluate((element) => element.contains(document.activeElement))).toBe(true)
    }
    await page.locator('main a').first().evaluate((element: HTMLElement) => element.focus())
    expect(await drawer.evaluate((element) => element.contains(document.activeElement))).toBe(true)
    await page.screenshot({ path: `visual-review/pre-launch-stabilization/${viewport.width}-drawer.png` })
    await page.keyboard.press('Escape')
    await expect(drawer).toHaveCount(0)
    await expect(trigger).toBeFocused()

    await trigger.click()
    await page.getByRole('dialog').click({ position: { x: 5, y: 100 } })
    await expect(drawer).toHaveCount(0)
    await expect(trigger).toBeFocused()

    await trigger.click()
    await drawer.getByRole('link', { name: 'Services', exact: true }).click()
    await expect(drawer).toHaveCount(0)
    await expect(trigger).toBeFocused()
    await expect(page).toHaveURL(/\/tech\/services$/)
    expect(await bottom.boundingBox()).toEqual(initialBottom)
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
    await page.screenshot({ path: `visual-review/pre-launch-stabilization/${viewport.width}-closed.png` })

    await trigger.click()
    await drawer.getByRole('link', { name: 'Projects', exact: true }).click()
    await expect(drawer).toHaveCount(0)
    await expect(page).toHaveURL(/\/tech\/projects$/)
    await expect(trigger).toBeFocused()
    await bottom.getByRole('link', { name: 'Services', exact: true }).click()
    await expect(page).toHaveURL(/\/tech\/services$/)
  })
}
