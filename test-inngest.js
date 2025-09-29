// Test Inngest imports
try {
  const { serve } = require('inngest/next');
  console.log('serve function:', typeof serve);
  
  const { inngest } = require('./src/inngest/client');
  console.log('inngest client:', typeof inngest);
  
  const { meetingsProcessing } = require('./src/inngest/functions');
  console.log('meetingsProcessing:', typeof meetingsProcessing);
  
  console.log('All imports successful');
} catch (error) {
  console.error('Import error:', error.message);
}