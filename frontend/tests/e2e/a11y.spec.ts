import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("a11y", () => {
  test("/login has no critical accessibility violations", async ({ page }) => {
    await page.goto("/login");
    const results = await new AxeBuilder({ page }).analyze();
    const violations = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(
      violations,
      violations
        .map(
          (v) => `${v.impact ?? "unknown"}: ${v.id} (${v.nodes.length} nodes)`
        )
        .join("\n")
    ).toEqual([]);
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  });

  test("/register has no critical accessibility violations", async ({
    page,
  }) => {
    await page.goto("/register");
    const results = await new AxeBuilder({ page }).analyze();
    const violations = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(
      violations,
      violations
        .map(
          (v) => `${v.impact ?? "unknown"}: ${v.id} (${v.nodes.length} nodes)`
        )
        .join("\n")
    ).toEqual([]);
    await expect(
      page.getByRole("heading", { name: /create your account/i })
    ).toBeVisible();
  });
});
