import { test, expect } from "@playwright/test";

test("landing page has expected title and links", async ({ page }) => {
  await page.goto("/");

  // Check for "Host Game" button
  const hostLink = page.getByRole("link", { name: /主持遊戲/i });
  await expect(hostLink).toBeVisible();
  await expect(hostLink).toHaveAttribute("href", "/host/quizzes");

  // Check for "Join Game" button
  const joinLink = page.getByRole("link", { name: /加入遊戲/i });
  await expect(joinLink).toBeVisible();
  await expect(joinLink).toHaveAttribute("href", "/join");
});
