const testAIAgentConnection = async () => {
  console.log('Testing AI Agent Connection Fix...\n');

  // Test 1: Missing parameters
  console.log('Test 1: Missing parameters');
  try {
    const response = await fetch('http://localhost:3001/api/connect-ai-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await response.json();
    console.log(`Status: ${response.status}, Error: ${data.error}`);
    console.log(`✅ Expected 400 error: ${response.status === 400 ? 'PASS' : 'FAIL'}\n`);
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}\n`);
  }

  // Test 2: Invalid meeting ID
  console.log('Test 2: Invalid meeting ID');
  try {
    const response = await fetch('http://localhost:3001/api/connect-ai-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meetingId: 'invalid-meeting-id', agentId: 'test-agent' })
    });
    const data = await response.json();
    console.log(`Status: ${response.status}, Error: ${data.error}`);
    console.log(`Expected 404 error: ${response.status === 404 ? 'PASS' : 'FAIL'}\n`);
  } catch (error) {
    console.log(`Test failed: ${error.message}\n`);
  }

  // Test 3: Check if error messages are properly formatted
  console.log('Test 3: Error message format');
  try {
    const response = await fetch('http://localhost:3001/api/connect-ai-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meetingId: 'test', agentId: 'test' })
    });
    const data = await response.json();
    console.log(`Response has error field: ${data.error ? 'YES' : 'NO'}`);
    console.log(`Response has details field: ${data.details ? 'YES' : 'NO'}`);
    console.log(`Error format: ${data.error ? 'PASS' : 'FAIL'}\n`);
  } catch (error) {
    console.log(` Test failed: ${error.message}\n`);
  }

  console.log(' Test Summary:');
  console.log('- Fixed error parsing in AIAgentJoiner component');
  console.log('- Added smart retry logic to avoid infinite loops');
  console.log('- Added call existence check before Stream Video connection');
  console.log('- Improved error messages for different failure scenarios');
  console.log('- Added delay on first connection attempt');
  console.log('- Added input validation for meetingId and agentId');
};

testAIAgentConnection();