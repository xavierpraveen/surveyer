// @ts-check
import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// manually read .env.local
const envFile = fs.readFileSync('.env.local', 'utf-8');
const envUrlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const envKeyMatch = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || envUrlMatch[1];
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || envKeyMatch[1];

if (!supabaseServiceRoleKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("Fetching users from auth.users...");
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error("Error fetching users:", error);
    process.exit(1);
  }

  console.log(`Found ${users.length} users in DB.`);
  const browser = await chromium.launch({ headless: true });
  let successCount = 0;

  for (const user of users) {
    if (user.email === 'alice.chen@acme.dev') {
      console.log(`Skipping ${user.email} (already completed by instruction).`);
      continue;
    }

    console.log(`\n--- Processing ${user.email} ---`);
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto('http://localhost:3000/login');
      
      // Login
      await page.fill('input[name="email"]', user.email);
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => null);
      if (!page.url().includes('dashboard')) {
        console.log(`Failed to login or reach dashboard for ${user.email}. URL: ${page.url()}`);
        await context.close();
        continue;
      }

      const takeSurveyBtn = page.getByText('Take Survey').first();
      await page.waitForTimeout(2000); // Wait for surveys to load

      if (await takeSurveyBtn.count() === 0) {
        const viewSubmissionBtn = page.getByText('View Submission').first();
        if (await viewSubmissionBtn.count() > 0) {
          console.log(`Survey already completed for ${user.email}.`);
        } else {
          console.log(`No Take Survey button found for ${user.email}.`);
        }
        await context.close();
        continue;
      }

      await takeSurveyBtn.click();
      await page.waitForLoadState('networkidle');

      let isFinished = false;
      while (!isFinished) {
        await page.waitForTimeout(1000);
        
        const questions = await page.locator('.mb-6').all();
        if (questions.length === 0) {
            console.log("Waiting for questions to render...");
            await page.waitForTimeout(2000);
        }

        for (const q of questions) {
          const textInput = q.locator('input[type="text"]');
          if (await textInput.count() > 0 && await textInput.isVisible()) {
             await textInput.fill('Automated Test Answer');
          }
          
          const textarea = q.locator('textarea');
          if (await textarea.count() > 0 && await textarea.isVisible()) {
             await textarea.fill('Automated Test long answer response.');
          }

          const checkboxes = await q.locator('input[type="checkbox"]').all();
          if (checkboxes.length > 0 && await checkboxes[0].isVisible()) {
             await checkboxes[0].evaluate((node) => node.click());
          }

          const radios = await q.locator('input[type="radio"]').all();
          if (radios.length > 0 && await radios[0].isVisible()) {
             const isAnyChecked = await q.locator('input[type="radio"]:checked').count() > 0;
             if (!isAnyChecked) {
                 await radios[0].evaluate((node) => node.click());
             }
          }
        }

        const nextBtn = page.locator('button', { hasText: 'Next' });
        const submitBtn = page.locator('button', { hasText: 'Submit' });
        
        if (await submitBtn.count() > 0 && !(await submitBtn.isDisabled())) {
          console.log('Submitting...');
          await submitBtn.click();
          await page.waitForURL('**/confirmation', { timeout: 10000 }).catch(() => null);
          console.log(`Successfully completed survey for ${user.email}`);
          successCount++;
          isFinished = true;
        } else if (await nextBtn.count() > 0 && !(await nextBtn.isDisabled())) {
          console.log('Next page...');
          await nextBtn.click();
        } else {
          console.log(`No enabled Next/Submit button found or still disabled. Waiting...`);
          // might be disabled because of missing answers, wait a bit
          await page.waitForTimeout(1000);
          const tryNextAgain = page.locator('button', { hasText: 'Next' });
          const trySubmitAgain = page.locator('button', { hasText: 'Submit' });
          if (await trySubmitAgain.count() > 0 && !(await trySubmitAgain.isDisabled())) {
              console.log('Submitting...');
              await trySubmitAgain.click();
              await page.waitForURL('**/confirmation', { timeout: 10000 }).catch(() => null);
              console.log(`Successfully completed survey for ${user.email}`);
              successCount++;
              isFinished = true;
          } else if (await tryNextAgain.count() > 0 && !(await tryNextAgain.isDisabled())) {
              console.log('Next page...');
              await tryNextAgain.click();
          } else {
              console.log(`Still disabled after waiting. Aborting for ${user.email}.`);
              isFinished = true;
          }
        }
      }

    } catch (e) {
      console.log(`Error processing ${user.email}:`, e.message);
    }

    await context.close();
  }

  await browser.close();
  console.log(`\nFinished processing all users. Successfully completed ${successCount} new surveys.`);
}

main();
