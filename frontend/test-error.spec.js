import { test, expect } from '@playwright/test';

test('check for console errors', async ({ page }) => {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', exception => {
    errors.push(exception.message);
  });

  await page.goto('http://localhost:5173');
  await page.waitForTimeout(3000);
  
  if (errors.length > 0) {
    console.log("ERRORS_FOUND: ", errors);
  } else {
    console.log("NO_ERRORS_FOUND");
  }
});
