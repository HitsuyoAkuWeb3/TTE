import { test as baseTest } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules if needed, or use process.cwd()
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

export const test = baseTest.extend({
  page: async ({ page }, use) => {
    try {
      await use(page);
    } finally {
      // Collect coverage from the window object
      const coverage = await page.evaluate(() => (window as any).__coverage__).catch(() => null);

      if (coverage) {
        const coverageDir = path.join(process.cwd(), '.nyc_output');
        if (!fs.existsSync(coverageDir)) {
          fs.mkdirSync(coverageDir, { recursive: true });
        }
        
        // Save coverage with a unique name
        const filename = `coverage-${Date.now()}-${Math.floor(Math.random() * 10000)}.json`;
        fs.writeFileSync(
          path.join(coverageDir, filename),
          JSON.stringify(coverage)
        );
      }
    }
  },
});

export { expect } from '@playwright/test';
