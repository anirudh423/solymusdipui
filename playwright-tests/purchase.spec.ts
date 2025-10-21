import { test, expect } from '@playwright/test'

test('navigate to policy purchase and open modal', async ({ page }) => {
    await page.goto('http://localhost:5173/policy-purchase')
    await expect(page.locator('.hero-title')).toHaveText(/Complete your purchase/)
    const purchase = page.locator('button.btn-purchase')
    await purchase.click()
    await expect(page.locator('.modal')).toBeVisible()
    const slider = page.locator('input[type="range"]')
    await slider.fill('10')
    await page.locator('button:has-text("Proceed and pay")').click()
    await expect(page.locator('.status.success')).toBeVisible({ timeout: 5000 })
})
