const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const extensionPath = path.resolve(__dirname);
  console.log('Extension Path:', extensionPath);

  const browser = await puppeteer.launch({
    headless: 'new', // Try new headless mode which supports extensions better
    dumpio: true, // Enable stdout/stderr from browser
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  // Wait for background worker
  const workerTarget = await browser.waitForTarget(
    target => target.type() === 'service_worker'
  );
  const worker = await workerTarget.worker();
  
  // Enable debug mode via storage
  await worker.evaluate(() => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ 
        debugMode: true,
        isEnabled: true,
        bgColor: '#ff0000', // Bright red for visibility testing
        textColor: '#ffffff'
      }, resolve);
    });
  });
  console.log('Debug mode enabled via Service Worker.');

  const page = await browser.newPage();
  
  // Listen to console logs
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  // Navigate to a safe test page
  console.log('Navigating to example.com...');
  await page.goto('https://example.com');

  // Wait for a moment to ensure content script injection
  await new Promise(r => setTimeout(r, 1000));

  console.log('Checking for content script injection...');
  // Check if the style element exists
  const styleExists = await page.evaluate(() => {
    return !!document.getElementById('bluelight-filter-style');
  });

  if (styleExists) {
    console.log('✅ PASS: Style element found.');
  } else {
    console.error('❌ FAIL: Style element NOT found.');
  }

  // Simulate enabling the filter via storage
  console.log('Simulating settings change (Enable Night Mode)...');
  
  // We can't directly access chrome.storage from the page context.
  // We have to rely on the fact that the extension listens to storage changes.
  // But puppeteer controls the *page*, not the extension background context directly easily without finding the background target.
  
  // Let's find the background page/service worker to verify it's running
  const targets = browser.targets();
  const backgroundTarget = targets.find(t => t.type() === 'service_worker' || t.type() === 'background_page');
  
  if (backgroundTarget) {
      console.log('✅ PASS: Background service worker/page found.');
  } else {
      console.log('⚠️ WARNING: Background target not found (Manifest V3 uses service workers, might be lazy loaded).');
  }

  // To test the effect, we can verify if the style content is empty or not.
  // Initially it might be empty if no settings are saved.
  
  // Let's try to verify if the global variable exists in the page context (if we exposed it, but we didn't).
  // Instead, let's check if the style element is in the DOM, which we did.

  // Since we can't easily trigger chrome.storage change from "outside" without connecting to the background worker,
  // we will assume that if the style element is present, the injection worked.
  
  // Let's try to see if we can detect the "Extension context invalidated" error by reloading.
  console.log('Reloading page to check for context validation errors...');
  await page.reload();
  await new Promise(r => setTimeout(r, 1000));
  
  const styleExistsAfterReload = await page.evaluate(() => {
    return !!document.getElementById('bluelight-filter-style');
  });
  
  if (styleExistsAfterReload) {
      console.log('✅ PASS: Style element persists after reload.');
  } else {
      console.error('❌ FAIL: Style element lost after reload.');
  }

  // --- NEW TESTS: Color Verification & Exclusion Logic ---

  console.log('Verifying computed styles (Color Application)...');
  const bgColor = await page.evaluate(() => {
    return window.getComputedStyle(document.body).backgroundColor;
  });
  
  // We set bgColor to '#ff0000' (rgb(255, 0, 0)) earlier
  if (bgColor === 'rgb(255, 0, 0)') {
      console.log('✅ PASS: Background color applied correctly (Red).');
  } else {
      console.error(`❌ FAIL: Background color mismatch. Expected rgb(255, 0, 0), got ${bgColor}`);
  }

  console.log('Testing Excluded URL logic...');
  // Update storage to exclude example.com
  await worker.evaluate(() => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ 
        excludedUrls: ['example.com']
      }, resolve);
    });
  });
  
  // Wait for storage change to propagate and content script to react
  await new Promise(r => setTimeout(r, 1000));
  
  const styleContentAfterExclusion = await page.evaluate(() => {
      const el = document.getElementById('bluelight-filter-style');
      return el ? el.textContent : null;
  });

  // The style element should exist (we don't remove the element, just clear content), 
  // OR the content should be empty string.
  if (styleContentAfterExclusion === '') {
      console.log('✅ PASS: Style content cleared for excluded URL.');
  } else {
      console.error(`❌ FAIL: Style content NOT cleared. Content length: ${styleContentAfterExclusion.length}`);
  }
  
  // Re-enable (remove exclusion)
  console.log('Re-enabling (removing exclusion)...');
  await worker.evaluate(() => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ 
        excludedUrls: []
      }, resolve);
    });
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  const styleContentAfterReenable = await page.evaluate(() => {
      return document.getElementById('bluelight-filter-style').textContent;
  });
  
  if (styleContentAfterReenable.length > 0) {
      console.log('✅ PASS: Style content restored after removing exclusion.');
  } else {
      console.error('❌ FAIL: Style content NOT restored.');
  }

  console.log('Test completed.');
  // Keep browser open for a few seconds to see
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
