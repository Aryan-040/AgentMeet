# AI Agent Auto-Join Testing Guide

## Overview
This guide helps test the AI agent auto-join functionality that was just implemented.

## What Was Implemented

### 1. AI Agent Joiner Component
- Created `AIAgentJoiner` component that automatically triggers AI agent joining when a user enters an active call
- Includes retry logic and reconnection mechanisms
- Monitors call state to ensure AI agent stays connected

### 2. Enhanced Call Flow
- Updated `CallView` → `CallProvider` → `CallConnect` → `CallUI` chain to pass agent data
- AI agent information now flows through the entire call hierarchy
- `AIAgentJoiner` is rendered when user is in an active call

### 3. Improved Chat Functionality
- Enhanced chat channel initialization logic
- Added better error handling for channel creation
- Improved debugging logs for troubleshooting

## Testing Steps

### Step 1: Test AI Agent Auto-Join
1. Create a meeting with an AI agent
2. Join the meeting as a user
3. Check browser console for logs:
   - "AI Agent Joiner mounted"
   - "Triggering AI agent join for meeting: [meetingId]"
   - "AI agent join triggered successfully"
4. Verify the AI agent appears in the call participants

### Step 2: Test Chat Functionality
1. Complete a meeting (let it run for a few minutes)
2. Go to the meeting details page
3. Click on "Ask AI" tab
4. Send a message to the AI
5. Check for response (should take 5-10 seconds)
6. Check browser console and server logs for:
   - "Initializing chat for meeting: [meetingId]"
   - "Channel exists and watch started" or "New channel created"
   - "[webhook] New message received"
   - "[webhook] AI response sent successfully"

### Step 3: Test Reconnection
1. Join a meeting with AI agent
2. Wait for AI agent to join
3. Simulate network issues (disable/enable network)
4. Verify AI agent reconnects automatically

## Debugging

### Common Issues and Solutions

#### AI Agent Not Joining
- Check browser console for error messages
- Verify `agent` prop is being passed correctly through components
- Ensure webhook endpoint is accessible
- Check that `OPENAI_API_KEY` is set in environment

#### Chat Not Working
- Verify chat channel is created in Stream dashboard
- Check webhook logs for message processing
- Ensure meeting status is "completed" for chat to work
- Verify agent exists and has proper instructions

#### No AI Response
- Check OpenAI API key configuration
- Verify webhook is receiving `message.new` events
- Check server logs for GPT processing errors
- Ensure meeting has summary data

### Log Locations
- Browser console: Client-side logs (chat initialization, AI joiner)
- Server logs: Webhook processing, GPT responses
- Stream dashboard: Real-time events and channel status

## Environment Variables Required
```bash
NEXT_PUBLIC_STREAM_VIDEO_KEY=your_stream_video_key
STREAM_VIDEO_SECRET=your_stream_video_secret
NEXT_PUBLIC_STREAM_CHAT_KEY=your_stream_chat_key
STREAM_CHAT_SECRET=your_stream_chat_secret
OPENAI_API_KEY=your_openai_api_key
```

## Success Indicators
- ✅ AI agent appears in call participants
- ✅ Chat messages receive AI responses
- ✅ No errors in browser console
- ✅ Webhook logs show successful message processing
- ✅ Stream dashboard shows active channels