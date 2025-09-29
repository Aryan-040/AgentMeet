// Test script to verify single AI agent connection logic
const testSingleAgentLogic = async () => {
    const meetingId = "test-meeting-123";
    const agentId1 = "agent-1";
    const agentId2 = "agent-2";

    console.log("Testing Single AI Agent Logic...\n");

    // Test 1: First agent connects successfully
    console.log("Test 1: First agent connection attempt");
    try {
        const response1 = await fetch("http://localhost:3001/api/connect-ai-agent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ meetingId, agentId: agentId1 }),
        });

        const data1 = await response1.json();
        console.log(`Response: ${response1.status} - ${JSON.stringify(data1)}`);
        
        if (response1.ok) {
            console.log("First agent connected successfully");
        } else {
            console.log("First agent connection failed");
        }
    } catch (error) {
        console.error("First agent connection error:", error.message);
    }

    console.log("\n" + "=".repeat(50) + "\n");

    // Test 2: Same agent tries to connect again (should succeed with alreadyConnected)
    console.log("Test 2: Same agent attempts to connect again");
    try {
        const response2 = await fetch("http://localhost:3001/api/connect-ai-agent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ meetingId, agentId: agentId1 }),
        });

        const data2 = await response2.json();
        console.log(`Response: ${response2.status} - ${JSON.stringify(data2)}`);
        
        if (response2.ok && data2.alreadyConnected) {
            console.log(" Same agent reconnection handled correctly");
        } else {
            console.log(" Same agent reconnection not handled properly");
        }
    } catch (error) {
        console.error(" Same agent reconnection error:", error.message);
    }

    console.log("\n" + "=".repeat(50) + "\n");

    // Test 3: Different agent tries to connect (should fail with 409)
    console.log("Test 3: Different agent attempts to connect");
    try {
        const response3 = await fetch("http://localhost:3001/api/connect-ai-agent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ meetingId, agentId: agentId2 }),
        });

        const data3 = await response3.json();
        console.log(`Response: ${response3.status} - ${JSON.stringify(data3)}`);
        
        if (response3.status === 409) {
            console.log(" Second agent properly blocked with conflict error");
        } else {
            console.log(" Second agent not properly blocked");
        }
    } catch (error) {
        console.error("Second agent connection error:", error.message);
    }

    console.log("\n" + "=".repeat(50) + "\n");

    // Test 4: Try to connect to completed meeting
    console.log("Test 4: Attempt to connect to completed meeting");
    try {
        // First create a completed meeting
        const completedMeetingId = "completed-meeting-123";
        
        const response4 = await fetch("http://localhost:3001/api/connect-ai-agent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ meetingId: completedMeetingId, agentId: agentId1 }),
        });

        const data4 = await response4.json();
        console.log(`Response: ${response4.status} - ${JSON.stringify(data4)}`);
        
        if (response4.status === 400 && data4.error?.includes("completed")) {
            console.log("Completed meeting properly rejected");
        } else {
            console.log("Completed meeting not properly rejected");
        }
    } catch (error) {
        console.error(" Completed meeting test error:", error.message);
    }

    console.log("\n Single Agent Logic Tests Complete!");
};

// Run the tests
testSingleAgentLogic().catch(console.error);