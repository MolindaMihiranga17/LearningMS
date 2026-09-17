import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";

let css: string;
test.beforeAll(async () => {
  const from = path.resolve("src/app/globals.css");
  css = (await postcss([tailwind()]).process(readFileSync(from, "utf8"), { from })).css;
  const require = createRequire(path.resolve("package.json"));
  for (const weight of [400, 600, 700]) {
    const font = readFileSync(require.resolve(`@fontsource/poppins/files/poppins-latin-${weight}-normal.woff2`)).toString("base64");
    css += `@font-face { font-family: Poppins; font-style: normal; font-weight: ${weight}; src: url(data:font/woff2;base64,${font}) format('woff2'); }`;
  }
});

for (const amount of ["LKR 106,200.00", "LKR 9,999,999,999.99"]) {
  test(`dashboard keeps ${amount} inside its cards`, async ({ page }, testInfo) => {
    const html = execFileSync(process.execPath, ["--import", "tsx", "tests/browser/render-dashboard.tsx", amount], { encoding: "utf8" });
    await page.setContent(`<html><head><style>${css}</style><style>:root { --font-poppins: Poppins, sans-serif; }</style></head><body>${html}</body></html>`);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.locator("main").evaluate((element) => getComputedStyle(element).fontFamily)).toContain("Poppins");
    await expect(page.getByText(amount, { exact: true })).toHaveCount(2);

    const overflow = await page.evaluate(() => {
      const problems: string[] = [];
      if (document.documentElement.scrollWidth > innerWidth) problems.push("page overflow");
      for (const value of document.querySelectorAll<HTMLElement>("[title] > span")) {
        const box = value.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(value);
        const text = range.getBoundingClientRect();
        if (text.right > box.right + 1 || text.left < box.left - 1) problems.push(value.textContent ?? "value overflow");
        if (range.getClientRects().length !== 1) problems.push("wrapped value");
      }
      return problems;
    });
    expect(overflow).toEqual([]);

    const cards = page.getByRole("region", { name: "Platform statistics" }).locator(":scope > div > div");
    await expect(cards).toHaveCount(5);
    if (testInfo.project.name === "desktop") {
      const tops = await cards.evaluateAll((elements) => elements.map((element) => Math.round(element.getBoundingClientRect().top)));
      expect(new Set(tops).size).toBe(1);
      const heroTops = await page.locator(".dashboard-hero [title]").evaluateAll((elements) => elements.map((element) => Math.round(element.getBoundingClientRect().top)));
      expect(new Set(heroTops).size).toBe(1);
    }
    await page.screenshot({ path: testInfo.outputPath("dashboard.png"), fullPage: true });
  });
}
