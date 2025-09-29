const crypto = require('crypto');

// Test script to verify message deduplication bypassing signature verification
const WEBHOOK_SECRET = process.env.STREAM_WEBHOOK_SECRET || 'test-secret';

function generateSignature(body) {
  return crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(body)
    .digest('hex');
}

async function testWebhook(payload, signature) {
  const response = await fetch('http://localhost:3001/api/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-signature': signature,
    },
    body: JSON.stringify(payload),
  });

  return {
    status: response.status,
    response: await response.json().catch(() => ({ error: 'No JSON response' })),
    timestamp: new Date().toISOString(),
  };
}

async function runTests() {
  console.log(' Testing message deduplication with valid signatures...\n');

  // Test 1: First message (should be processed)
  console.log(' Test 1: Sending first webhook request...');
  const payload1 = {
    type: 'message.new',
    user: { id: 'test-user-123' },
    channel_id: 'test-channel-456',
    message: { id: 'test-msg-789', text: 'Hello AI!' }
  };
  const signature1 = generateSignature(JSON.stringify(payload1));
  const result1 = await testWebhook(payload1, signature1);
  console.log('First request:', result1);
  console.log('');

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 100));

  // Test 2: Same message (should be deduplicated)
  console.log(' Test 2: Sending duplicate webhook request (same message ID)...');
  const result2 = await testWebhook(payload1, signature1);
  console.log('Duplicate request:', result2);
  console.log('');

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 100));

  // Test 3: Different message (should be processed)
  console.log(' Test 3: Sending different message (different message ID)...');
  const payload3 = {
    type: 'message.new',
    user: { id: 'test-user-123' },
    channel_id: 'test-channel-456',
    message: { id: 'test-msg-790', text: 'Hello AI again!' }
  };
  const signature3 = generateSignature(JSON.stringify(payload3));
  const result3 = await testWebhook(payload3, signature3);
  console.log('Different message request:', result3);
  console.log('');

  // Test 4: Same as test 3 (should be deduplicated)
  console.log(' Test 4: Sending duplicate of test 3...');
  const result4 = await testWebhook(payload3, signature3);
  console.log('Duplicate of different message:', result4);
  console.log('');

  console.log(' Test completed!');
  console.log('Expected behavior:');
  console.log('- Test 1: Should be processed (may fail due to missing meeting/agent)');
  console.log('- Test 2: Should be skipped as duplicate (fast response)');
  console.log('- Test 3: Should be processed as different message');
  console.log('- Test 4: Should be skipped as duplicate (fast response)');
}

runTests().catch(console.error);