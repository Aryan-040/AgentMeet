import { EmptyState } from "@/components/empty-state"

export const ProcessingState = () => {
    return(
        <div className="bg-white rounded-xl border shadow-sm px-6 py-8 flex flex-col gap-y-6 items-center justify-center">
            <EmptyState
                image="/processing.svg"
                title="Processing Meeting"
                description="Your meeting has ended and we're generating a summary. This usually takes a few moments."
            />
            <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    Processing...
                </div>
            </div>
        </div>
    )
}