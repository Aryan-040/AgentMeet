// Test script to verify message deduplication in webhook handler
// This simulates duplicate webhook events to ensure AI responds only once

const TEST_WEBHOOK_URL = 'http://localhost:3001/api/webhook';
const TEST_SIGNATURE = 'test-signature'; // This won't pass verification but will test the logic

async function testMessageDedup() {
  console.log(' Testing message deduplication...\n');

  // Test message data
  const testMessage = {
    type: 'message.new',
    user: { id: 'test-user-123' },
    channel_id: 'test-channel-456',
    message: {
      id: 'test-message-789',
      text: 'Hello AI, can you help me understand what was discussed in this meeting?'
    }
  };

  try {
    // Send the same message twice to simulate duplicate webhook events
    console.log(' Sending first webhook request...');
    const response1 = await fetch(TEST_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': TEST_SIGNATURE
      },
      body: JSON.stringify(testMessage)
    });

    console.log('First request status:', response1.status);
    const data1 = await response1.json();
    console.log('First request response:', data1);

    console.log('\n Sending duplicate webhook request (same message ID)...');
    const response2 = await fetch(TEST_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': TEST_SIGNATURE
      },
      body: JSON.stringify(testMessage)
    });

    console.log('Second request status:', response2.status);
    const data2 = await response2.json();
    console.log('Second request response:', data2);

    // Test with different message ID (should be processed)
    const differentMessage = {
      ...testMessage,
      message: {
        ...testMessage.message,
        id: 'test-message-790' // Different message ID
      }
    };

    console.log('\n📤 Sending different message (different message ID)...');
    const response3 = await fetch(TEST_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': TEST_SIGNATURE
      },
      body: JSON.stringify(differentMessage)
    });

    console.log('Third request status:', response3.status);
    const data3 = await response3.json();
    console.log('Third request response:', data3);

    console.log('\n✅ Test completed!');
    console.log('Expected behavior:');
    console.log('- First request: Should be processed (but may fail due to invalid signature)');
    console.log('- Second request: Should be skipped as duplicate (message already being processed)');
    console.log('- Third request: Should be processed as different message');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testMessageDedup();