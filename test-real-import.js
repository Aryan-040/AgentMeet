// Test importing the actual modules to see if there's a circular dependency
console.log('Testing real imports...');

try {
  console.log('1. Importing inngest client...');
  const clientModule = require('./src/inngest/client.ts');
  console.log('Client imported:', !!clientModule.inngest);
  
  console.log('2. Importing functions...');
  const functionsModule = require('./src/inngest/functions.ts');
  console.log('Functions imported:', !!functionsModule.meetingsProcessing);
  
  console.log('3. Testing if meetingsProcessing has getConfig...');
  const { meetingsProcessing } = functionsModule;
  console.log('meetingsProcessing type:', typeof meetingsProcessing);
  console.log('meetingsProcessing.getConfig:', typeof meetingsProcessing.getConfig);
  
  if (typeof meetingsProcessing.getConfig === 'function') {
    console.log('4. Testing getConfig...');
    const config = meetingsProcessing.getConfig();
    console.log('Config:', JSON.stringify(config, null, 2));
  }
  
} catch (error) {
  console.error('Error during import test:', error);
  console.error('Stack:', error.stack);
}