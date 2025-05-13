/**
 * Accessibility testing script for Quantera Platform
 * Uses axe-core to perform accessibility testing
 */

const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const fs = require('fs');
const path = require('path');

// Pages to test
const pagesToTest = [
  { url: '/', name: 'home' },
  { url: '/smart-account', name: 'smart-account' },
  { url: '/marketplace', name: 'marketplace' },
  { url: '/l2-bridge', name: 'l2-bridge' }
];

async function runAccessibilityTests() {
  console.log('Starting accessibility tests...');
  
  // Create report directory if it doesn't exist
  const reportDir = path.join(__dirname, '..', 'a11y-report');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir);
  }
  
  // Launch browser
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results = {};
  
  // Test each page
  for (const { url, name } of pagesToTest) {
    try {
      console.log(`Testing ${name} page...`);
      await page.goto(`http://localhost:3000${url}`);
      
      // Run axe analysis
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      
      // Save results
      results[name] = {
        violations: accessibilityScanResults.violations,
        passes: accessibilityScanResults.passes.length,
        incomplete: accessibilityScanResults.incomplete.length,
        inapplicable: accessibilityScanResults.inapplicable.length
      };
      
      // Write individual page report
      fs.writeFileSync(
        path.join(reportDir, `${name}.json`),
        JSON.stringify(accessibilityScanResults, null, 2)
      );
      
      console.log(`${name} page: ${accessibilityScanResults.violations.length} violations`);
    } catch (error) {
      console.error(`Error testing ${name} page:`, error);
      results[name] = { error: error.message };
    }
  }
  
  // Generate summary report
  const summary = {
    date: new Date().toISOString(),
    results
  };
  
  fs.writeFileSync(
    path.join(reportDir, 'summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  // Generate HTML report
  const htmlReport = generateHtmlReport(summary);
  fs.writeFileSync(
    path.join(reportDir, 'index.html'),
    htmlReport
  );
  
  // Close browser
  await browser.close();
  
  console.log('Accessibility tests completed. Reports saved to a11y-report/');
  
  // Exit with error code if any violations found
  const hasViolations = Object.values(results).some(result => 
    result.violations && result.violations.length > 0
  );
  
  if (hasViolations) {
    console.error('Accessibility violations found!');
    process.exit(1);
  }
}

function generateHtmlReport(summary) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Report - Quantera Platform</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
    h1, h2, h3 { margin-top: 0; }
    .container { max-width: 1200px; margin: 0 auto; }
    .summary { margin-bottom: 30px; }
    .page { margin-bottom: 40px; border: 1px solid #ddd; border-radius: 4px; padding: 20px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
    .violations { list-style-type: none; padding: 0; }
    .violation { background: #fff8f8; border-left: 4px solid #e74c3c; padding: 15px; margin-bottom: 15px; }
    .impact { display: inline-block; padding: 3px 6px; border-radius: 3px; font-size: 12px; font-weight: bold; margin-right: 10px; }
    .critical { background: #e74c3c; color: white; }
    .serious { background: #e67e22; color: white; }
    .moderate { background: #f1c40f; color: black; }
    .minor { background: #3498db; color: white; }
    .no-violations { color: #27ae60; font-weight: bold; }
    .error { color: #e74c3c; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Accessibility Report - Quantera Platform</h1>
    <div class="summary">
      <p>Generated on: ${new Date(summary.date).toLocaleString()}</p>
      <h2>Summary</h2>
      <table>
        <tr>
          <th>Page</th>
          <th>Violations</th>
          <th>Passes</th>
          <th>Incomplete</th>
          <th>Inapplicable</th>
        </tr>
        ${Object.entries(summary.results).map(([pageName, result]) => `
          <tr>
            <td>${pageName}</td>
            <td>${result.error ? 'Error' : result.violations ? result.violations.length : 0}</td>
            <td>${result.error ? 'Error' : result.passes || 0}</td>
            <td>${result.error ? 'Error' : result.incomplete || 0}</td>
            <td>${result.error ? 'Error' : result.inapplicable || 0}</td>
          </tr>
        `).join('')}
      </table>
    </div>

    ${Object.entries(summary.results).map(([pageName, result]) => `
      <div class="page">
        <div class="page-header">
          <h2>${pageName}</h2>
          ${result.error 
            ? `<span class="error">Error: ${result.error}</span>` 
            : result.violations && result.violations.length 
              ? `<span>${result.violations.length} violations</span>` 
              : `<span class="no-violations">No violations</span>`
          }
        </div>

        ${result.error ? '' : result.violations && result.violations.length ? `
          <h3>Violations</h3>
          <ul class="violations">
            ${result.violations.map(violation => `
              <li class="violation">
                <div>
                  <span class="impact ${violation.impact}">${violation.impact}</span>
                  <strong>${violation.id}: ${violation.help}</strong>
                </div>
                <p>${violation.description}</p>
                <p><strong>Elements affected:</strong> ${violation.nodes.length}</p>
                <details>
                  <summary>Learn more</summary>
                  <p>${violation.helpUrl}</p>
                </details>
              </li>
            `).join('')}
          </ul>
        ` : ''}
      </div>
    `).join('')}
  </div>
</body>
</html>
  `;
}

// Run the tests
runAccessibilityTests().catch(error => {
  console.error('Error running accessibility tests:', error);
  process.exit(1);
}); 