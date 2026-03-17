import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Navigating to login...");
  await page.goto('http://localhost:3000/login');
  
  console.log("Logging in as bob.kim...");
  await page.fill('input[name="email"]', 'bob.kim@acme.dev');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  console.log("Waiting for dashboard...");
  await page.waitForURL('**/dashboard');

  console.log("Dashboard loaded. Looking for 'Take Survey' button...");
  const takeSurveyBtn = page.getByText('Take Survey');
  
  if (await takeSurveyBtn.count() > 0) {
    console.log("Clicking Take Survey...");
    await takeSurveyBtn.first().click();
    await page.waitForLoadState('networkidle');
    console.log("Survey Page URL:", page.url());
    
    // get survey title and form fields
    const html = await page.content();
    console.log("Page has forms:", await page.locator('form').count());
    console.log("Radio buttons:", await page.locator('input[type="radio"]').count());
    console.log("Textareas:", await page.locator('textarea').count());
    console.log("Submit button text:", await page.locator('button[type="submit"]').textContent());
  } else {
    console.log("No Take Survey button found.");
  }

  await browser.close();
})();
