import { LoadingState } from "@/components/loading-state";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { 
  Chat, 
  Channel, 
  Window, 
  MessageList, 
  MessageInput, 
  Thread,
  useCreateChatClient
} from "stream-chat-react";
import { Channel as StreamChannel } from "stream-chat";
import "stream-chat-react/dist/css/v2/index.css";

interface ChatUIProps {
  meetingId: string;
  meetingName: string;
  userId: string;
  userName: string;
  userImage: string | undefined;
}

export const ChatUI = ({
  meetingId,
  meetingName,
  userId,
  userName,
  userImage,
}: ChatUIProps) => {
  const trpc = useTRPC();
  const { mutateAsync: generateChatToken } = useMutation(
    trpc.meetings.generateChatToken.mutationOptions()
  );

  const [channel, setChannel] = useState<StreamChannel>();
  const client = useCreateChatClient({
    apiKey: process.env.NEXT_PUBLIC_STREAM_CHAT_API_KEY!,
    tokenOrProvider: generateChatToken,
    userData: {
      id: userId,
      name: userName,
      image: userImage,
    },
  });

  useEffect(() => {
    const initChat = async () => {
      if (!client) return;
      try {
        console.log("Initializing chat for meeting:", meetingId);
        // Check if channel exists first
        const channel = client.channel("messaging", meetingId);
        try {
          await channel.watch();
          console.log("Channel exists and watch started");
        } catch {
          console.log("Channel doesn't exist, creating new one");
  
          const newChannel = client.channel("messaging", meetingId, {
            members: [userId],
            created_by: { id: userId },
          });
          await newChannel.create();
          await newChannel.watch();
          console.log("New channel created and watch started");
          setChannel(newChannel);
          return;
        }
        setChannel(channel);
      } catch (error) {
        console.error("Failed to initialize chat:", error);
      }
    };
    initChat();
    return () => {
      if (client) {
        client.disconnectUser();
      }
    };
  }, [client, meetingId, meetingName, userId]);

  if (!client) {
    return (
      <LoadingState
        title="Loading Chat"
        description="This may take a few seconds"
      />
    );
  }
  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <Chat client={client}>
        <Channel channel={channel}>
          <Window>
            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-23rem)] border-b">
              <MessageList />
            </div>
            <MessageInput />
          </Window>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
};
