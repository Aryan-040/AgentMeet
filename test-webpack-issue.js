// Test if there's a webpack/module resolution issue
console.log('Testing module resolution...');

try {
  console.log('1. Testing inngest/next import...');
  const { serve } = require('inngest/next');
  console.log('serve imported successfully:', typeof serve);
  
  console.log('2. Testing inngest client import...');
  const { inngest } = require('./src/inngest/client.ts');
  console.log('inngest imported successfully:', typeof inngest);
  
  console.log('3. Testing functions import...');
  const { meetingsProcessing } = require('./src/inngest/functions.ts');
  console.log('meetingsProcessing imported successfully:', typeof meetingsProcessing);
  console.log('meetingsProcessing.getConfig:', typeof meetingsProcessing.getConfig);
  
  console.log('4. Testing serve function call...');
  const result = serve({
    client: inngest,
    functions: [meetingsProcessing]
  });
  console.log('serve result:', typeof result);
  console.log('serve result keys:', Object.keys(result));
  
} catch (error) {
  console.error('Error during test:', error);
  console.error('Stack:', error.stack);
}