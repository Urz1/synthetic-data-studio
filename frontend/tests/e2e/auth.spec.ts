import { test, expect } from "@playwright/test";

function makeFakeJwt(payload: Record<string, unknown>): string {
  const header = { alg: "none", typ: "JWT" };
  const enc = (obj: any) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  return `${enc(header)}.${enc(payload)}.`;
}

test.describe("auth", () => {
  test("protected route redirects to /login with next", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login\?next=/);
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  });

  test("login form posts to /api/auth/login and redirects (mocked)", async ({
    page,
  }) => {
    const token = makeFakeJwt({
      sub: "test-user",
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    });

    await page.route("**/api/auth/login", async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          // Simulate server setting the httpOnly session cookie
          "set-cookie": `ss_jwt=${token}; Path=/; HttpOnly; SameSite=Lax`,
        },
        body: JSON.stringify({
          ok: true,
          redirect: "/dashboard",
          // fake JWT-like shape (header.payload.sig) so enhancer can decode
          token,
        }),
      });
    });

    await page.goto("/login");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("**/dashboard");
  });

  test("register form validates password mismatch (server redirect)", async ({
    page,
  }) => {
    await page.route("**/api/auth/register", async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          ok: false,
          redirect: "/register?error=Passwords%20do%20not%20match",
          error: "Passwords do not match",
        }),
      });
    });

    await page.goto("/register");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByLabel("Confirm Password").fill("password456");
    await page.getByRole("button", { name: /create account/i }).click();
    await page.waitForURL(/\/register\?error=/);
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: /passwords do not match/i })
        .first()
    ).toBeVisible();
  });
});
