/**
 * Test script to verify that all asset links are working correctly.
 * 
 * This script:
 * 1. Logs all asset IDs from both the treasury and environmental assets data
 * 2. Shows how to construct the URLs for asset detail pages
 * 3. Can be used to verify that the AssetDetailPage component can load all assets
 */

// Function to simulate accessing the assets
function testAssetAccess() {
  console.log('=====================================');
  console.log('TESTING ASSET ID ACCESS');
  console.log('=====================================');
  
  // In a real browser environment, we would import these from the data files
  // For this test, we'll just define them here to show what URLs to try
  const treasuryIds = [
    'tbill-3m-2023q4',
    'tnote-5y-2023q3',
    'tbond-30y-2023q3'
  ];
  
  const environmentalIds = [
    '0x5f0f0e0d0c0b0a09080706050403020100000005', // Amazon Rainforest Carbon Credits
    '0x5f0f0e0d0c0b0a09080706050403020100000006', // Blue Carbon Mangrove Restoration
    '0x5f0f0e0d0c0b0a09080706050403020100000007', // Highland Watershed Protection Initiative
    '0x5f0f0e0d0c0b0a09080706050403020100000008'  // Moroccan Solar Thermal Power Generation
  ];
  
  console.log('Treasury Assets:');
  treasuryIds.forEach(id => {
    console.log(`- ${id} → /assets/${id}`);
  });
  
  console.log('\nEnvironmental Assets:');
  environmentalIds.forEach(id => {
    console.log(`- ${id} → /assets/${id}`);
  });
  
  console.log('\nTo test, visit these URLs in your browser:');
  console.log('http://localhost:3000/assets/tbill-3m-2023q4');
  console.log('http://localhost:3000/assets/tnote-5y-2023q3');
  console.log('http://localhost:3000/assets/tbond-30y-2023q3');
  console.log('http://localhost:3000/assets/0x5f0f0e0d0c0b0a09080706050403020100000005');
  
  console.log('\nAll should display detailed information about the asset.');
  console.log('=====================================');
}

// Execute the test
testAssetAccess(); 