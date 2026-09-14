import { expect, test } from "@playwright/test";

// The site chrome every page gets from BaseLayout: brand, nav, theme toggle.
test("home page renders the site chrome", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Foxxe Labs/);
  await expect(page.locator(".sitebar .brand")).toHaveText("Foxxe Labs");
  const nav = page.locator("nav.nav");
  await expect(nav).toBeVisible();
  await expect(nav.locator("a")).toHaveCount(8);
  await expect(nav.locator('a[href="/"]')).toHaveClass(/active/);
  await expect(page.locator("#theme-toggle")).toBeVisible();
});

test("theme toggle switches data-theme", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  const before = await html.getAttribute("data-theme");
  await page.locator("#theme-toggle").click();
  await expect.poll(() => html.getAttribute("data-theme")).not.toBe(before);
});

test("news index lists posts and links resolve", async ({ page }) => {
  await page.goto("/news/");
  await expect(page.locator("nav.nav a[href='/news/']")).toHaveClass(/active/);
  const first = page.locator("main a[href^='/news/']").first();
  await expect(first).toBeVisible();
  const href = await first.getAttribute("href");
  const res = await page.request.get(href!);
  expect(res.status()).toBe(200);
});
