const { serve } = require('inngest/next');

// Mock the client and functions to see what's happening
const mockClient = { name: 'test-client' };
const mockFunctions = [{ name: 'test-function' }];

try {
  console.log('Testing serve function...');
  console.log('serve type:', typeof serve);
  
  // Try to call serve with our mock data
  const result = serve({
    client: mockClient,
    functions: mockFunctions
  });
  
  console.log('serve returned:', typeof result);
  console.log('serve result:', result);
} catch (error) {
  console.error('Error calling serve:', error);
  console.error('Error stack:', error.stack);
}