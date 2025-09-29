// Simple test script to verify the connect-ai-agent endpoint
// Run with: node test-connect-ai-agent.js

const testConnection = async () => {
  try {
    console.log('Testing connect-ai-agent endpoint...');
    
    // This is just a basic connectivity test
    // In a real scenario, you'd need valid meetingId and agentId
    const response = await fetch('http://localhost:3000/api/connect-ai-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        meetingId: 'test-meeting-id',
        agentId: 'test-agent-id',
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response statusText:', response.statusText);
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.status === 404) {
      console.log('Endpoint is accessible (404 is expected for invalid IDs)');
    } else if (response.status === 400) {
      console.log('Endpoint is accessible (400 is expected for missing fields)');
    } else {
      console.log('Unexpected response status');
    }
    
  } catch (error) {
    console.error('Failed to connect to endpoint:', error.message);
  }
};

// Wait a bit for the server to start, then test
setTimeout(testConnection, 5000);