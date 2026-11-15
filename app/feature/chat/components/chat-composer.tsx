import type { ChatController } from "../use-chat";

type Props = Pick<ChatController, "input" | "setInput" | "isModelReady" | "generating" | "sendMessage" | "stopGeneration">;

export function ChatComposer({ input, setInput, isModelReady, generating, sendMessage, stopGeneration }: Props) {
    return (
        <footer className="craft-composer">
            <div className="craft-input-panel">
                <textarea
                    value={input}
                    aria-label="Your message"
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && window.matchMedia("(pointer: fine)").matches) {
                            e.preventDefault();
                            sendMessage();
                        }
                    }}
                    placeholder={isModelReady ? "Message your local model..." : "Load the selected model to start chatting..."}
                    disabled={!isModelReady || generating}
                    rows={1}
                    className="max-h-40 min-h-12 flex-1 resize-y bg-transparent px-3 py-2 text-sm outline-none placeholder:text-zinc-600 disabled:opacity-50"
                />
                {generating ? (
                    <button onClick={stopGeneration} className="craft-button craft-button-danger">■ Stop</button>
                ) : (
                    <button onClick={sendMessage} disabled={!isModelReady || !input.trim()} className="craft-button craft-button-primary">Send <span aria-hidden="true">↗</span></button>
                )}
            </div>
            <p className="mt-2 text-center text-[10px] text-zinc-600">Enter to send · Shift+Enter for a new line</p>
        </footer>
    );
}
