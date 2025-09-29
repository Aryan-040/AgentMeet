// Simple test to verify API is working
async function testAPI() {
    try {
        console.log("Testing API endpoint...");
        const response = await fetch("http://localhost:3001/api/connect-ai-agent", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                meetingId: "test-meeting-123",
                agentId: "test-agent-123"
            }),
        });

        console.log("Response status:", response.status);
        const data = await response.json();
        console.log("Response data:", data);
        
    } catch (error) {
        console.error("API test failed:", error.message);
    }
}

testAPI();