// Demonstration script to show deduplication timing differences
async function testTiming() {
  console.log('⏱️  Testing deduplication timing differences...\n');

  const testPayload = {
    type: 'message.new',
    user: { id: 'test-user-123' },
    channel_id: 'test-channel-456',
    message: { id: 'test-msg-timing', text: 'Hello AI!' }
  };

  // Test 1: First request (should be slower)
  console.log('📤 Sending first request...');
  const start1 = Date.now();
  const response1 = await fetch('http://localhost:3001/api/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-signature': 'invalid-signature-1',
    },
    body: JSON.stringify(testPayload),
  });
  const time1 = Date.now() - start1;
  console.log(`⏱️  First request took: ${time1}ms (Status: ${response1.status})`);

  // Wait a tiny bit
  await new Promise(resolve => setTimeout(resolve, 50));

  // Test 2: Duplicate request (should be much faster)
  console.log('\n📤 Sending duplicate request (same message ID)...');
  const start2 = Date.now();
  const response2 = await fetch('http://localhost:3001/api/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-signature': 'invalid-signature-2',
    },
    body: JSON.stringify(testPayload),
  });
  const time2 = Date.now() - start2;
  console.log(`⏱️  Duplicate request took: ${time2}ms (Status: ${response2.status})`);

  // Test 3: Different message (should be slower again)
  const differentPayload = {
    ...testPayload,
    message: { ...testPayload.message, id: 'test-msg-different' }
  };
  
  console.log('\n📤 Sending different message (different message ID)...');
  const start3 = Date.now();
  const response3 = await fetch('http://localhost:3001/api/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-signature': 'invalid-signature-3',
    },
    body: JSON.stringify(differentPayload),
  });
  const time3 = Date.now() - start3;
  console.log(`⏱️  Different message took: ${time3}ms (Status: ${response3.status})`);

  console.log('\n📊 Results Summary:');
  console.log(`- First request: ${time1}ms`);
  console.log(`- Duplicate request: ${time2}ms (${Math.round((time2/time1) * 100)}% of original time)`);
  console.log(`- Different message: ${time3}ms`);
  
  if (time2 < time1 / 2) {
    console.log('\n✅ DEDUPLICATION IS WORKING! Duplicate requests are much faster.');
  } else {
    console.log('\n❌ Deduplication may not be working properly.');
  }
}

testTiming().catch(console.error);