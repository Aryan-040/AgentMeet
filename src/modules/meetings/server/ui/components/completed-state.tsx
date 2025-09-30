
import { GeneratedAvatarProps } from "@/components/generated-avatar";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/utils";
import { MeetingGetOne } from "@/modules/meetings/types";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { format } from "date-fns";
import {
  BookOpenTextIcon,
  ClockFadingIcon,
  FileTextIcon,
  FileVideoIcon,
  Link,
  SparklesIcon,
} from "lucide-react";
import Markdown from "react-markdown";
import { Transcript } from "./transcript";
import { ChatProvider } from "./chat-provider";

interface Props {
  data: MeetingGetOne;
}

export const CompletedState = ({ data }: Props) => {
  return (
    <div className="flex flex-col gap-y-6">
      <Tabs defaultValue="summary" className="w-full">
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <ScrollArea className="p-0 bg-background justify-start rounded-none">
            <TabsList className="w-full bg-gray-50/50 p-1 rounded-none border-b grid grid-cols-4 h-auto">
              <TabsTrigger
                value="summary"
                className="group relative flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 
                          rounded-lg bg-transparent border-0 shadow-none transition-all duration-200 ease-in-out
                          hover:text-gray-900 hover:bg-white hover:shadow-sm
                          data-[state=active]:text-blue-600 data-[state=active]:bg-white data-[state=active]:shadow-md
                          data-[state=active]:border-blue-100 focus-visible:outline-none focus-visible:ring-2 
                          focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <BookOpenTextIcon className="h-4 w-4 transition-colors" />
                <span>Summary</span>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 w-0 bg-blue-600 
                              transition-all duration-200 group-data-[state=active]:w-full"></div>
              </TabsTrigger>
              
              <TabsTrigger
                value="transcript"
                className="group relative flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 
                          rounded-lg bg-transparent border-0 shadow-none transition-all duration-200 ease-in-out
                          hover:text-gray-900 hover:bg-white hover:shadow-sm
                          data-[state=active]:text-blue-600 data-[state=active]:bg-white data-[state=active]:shadow-md
                          data-[state=active]:border-blue-100 focus-visible:outline-none focus-visible:ring-2 
                          focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <FileTextIcon className="h-4 w-4 transition-colors" />
                <span>Transcript</span>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 w-0 bg-blue-600 
                              transition-all duration-200 group-data-[state=active]:w-full"></div>
              </TabsTrigger>
              
              <TabsTrigger
                value="recording"
                className="group relative flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 
                          rounded-lg bg-transparent border-0 shadow-none transition-all duration-200 ease-in-out
                          hover:text-gray-900 hover:bg-white hover:shadow-sm
                          data-[state=active]:text-blue-600 data-[state=active]:bg-white data-[state=active]:shadow-md
                          data-[state=active]:border-blue-100 focus-visible:outline-none focus-visible:ring-2 
                          focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <FileVideoIcon className="h-4 w-4 transition-colors" />
                <span>Recording</span>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 w-0 bg-blue-600 
                              transition-all duration-200 group-data-[state=active]:w-full"></div>
              </TabsTrigger>
              
              <TabsTrigger
                value="chat"
                className="group relative flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 
                          rounded-lg bg-transparent border-0 shadow-none transition-all duration-200 ease-in-out
                          hover:text-gray-900 hover:bg-white hover:shadow-sm
                          data-[state=active]:text-blue-600 data-[state=active]:bg-white data-[state=active]:shadow-md
                          data-[state=active]:border-blue-100 focus-visible:outline-none focus-visible:ring-2 
                          focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <SparklesIcon className="h-4 w-4 transition-colors" />
                <span>Ask AI</span>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 w-0 bg-blue-600 
                              transition-all duration-200 group-data-[state=active]:w-full"></div>
              </TabsTrigger>
            </TabsList>
          </ScrollArea>
        </div>

        <div className="mt-4">
          <TabsContent value="recording" className="mt-0">
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <video
                src={data.recordingUrl!}
                className="w-full rounded-lg shadow-md"
                controls
              />
            </div>
          </TabsContent>

          <TabsContent value="summary" className="mt-0">
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <h2 className="text-3xl font-semibold text-gray-900 capitalize tracking-tight">
                    {data.name}
                  </h2>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 ml-0">
                    <Link
                      href={`/agents/${data.agent.id}`}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 hover:bg-gray-100 
                               transition-colors duration-200 text-gray-700 hover:text-gray-900 no-underline"
                    >
                      <GeneratedAvatarProps
                        variant="botttsNeutal"
                        seed={data.agent.name}
                        className="size-5 rounded-full"
                      />
                      <span className="font-medium capitalize">{data.agent.name}</span>
                    </Link>
                    
                    
                    <div className="flex items-center gap-2 py-1.5 bg-blue-50 text-blue-700 rounded-full pl-0 ml-0">
                      <Link className="h-3.5 w-3.5" />
                      <span className="font-medium">
                        {data.startedAt ? format(data.startedAt, "PPP") : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 py-3 px-4 bg-gradient-to-r from-blue-50 to-indigo-50 
                                rounded-lg border border-blue-100">
                    <div className="flex-shrink-0">
                      <SparklesIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">AI-Generated Summary</p>
                    </div>
                    <Badge
                      variant="outline"
                      className="flex items-center gap-2 border-blue-200 text-blue-700 bg-blue-50/50"
                    >
                      <ClockFadingIcon className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">
                        {data.duration ? formatDuration(data.duration) : "No duration"}
                      </span>
                    </Badge>
                  </div>
                </div>

                <div className="prose prose-gray max-w-none">
                  <Markdown
                    components={{
                      h1: (props) => (
                        <h1 className="text-2xl font-semibold mb-4 text-gray-900 border-b border-gray-200 pb-2" {...props} />
                      ),
                      h2: (props) => (
                        <h2 className="text-xl font-semibold mb-4 text-gray-900 mt-8" {...props} />
                      ),
                      h3: (props) => (
                        <h3 className="text-lg font-semibold mb-3 text-gray-900 mt-6" {...props} />
                      ),
                      h4: (props) => (
                        <h4 className="text-base font-semibold mb-3 text-gray-900 mt-4" {...props} />
                      ),
                      p: (props) => (
                        <p className="mb-4 leading-relaxed text-gray-700 text-base" {...props} />
                      ),
                      ul: (props) => (
                        <ul className="list-disc list-outside mb-4 ml-6 space-y-1" {...props} />
                      ),
                      ol: (props) => (
                        <ol className="list-decimal list-outside mb-4 ml-6 space-y-1" {...props} />
                      ),
                      li: (props) => <li className="text-gray-700 leading-relaxed" {...props} />,
                      strong: (props) => (
                        <strong className="font-semibold text-gray-900" {...props} />
                      ),
                      code: (props) => (
                        <code
                          className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono"
                          {...props}
                        />
                      ),
                      blockquote: (props) => (
                        <blockquote
                          className="border-l-4 border-blue-200 pl-4 italic my-4 text-gray-600 bg-gray-50 py-2"
                          {...props}
                        />
                      ),
                    }}
                  >
                    {data.summary}
                  </Markdown>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="transcript" className="mt-0">
            <Transcript meetingId={data.id} />
          </TabsContent>

          <TabsContent value="chat" className="mt-0">
            <ChatProvider meetingId={data.id} meetingName={data.name} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
