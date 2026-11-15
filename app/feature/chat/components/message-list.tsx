import { useEffect, useRef } from "react";
import type { ChatController } from "../use-chat";
import { ResponsePerformance } from "./response-performance";
import { AssistantMarkdown } from "./assistant-markdown";

type Props = Pick<ChatController, "activeConversation" | "isModelReady" | "loadModel" | "loading" | "error">;

export function MessageList({ activeConversation, isModelReady, loadModel, loading, error }: Props) {
    const listRef = useRef<HTMLElement>(null);
    const followRef = useRef(true);

    useEffect(() => {
        followRef.current = true;
    }, [activeConversation?.id]);

    useEffect(() => {
        const list = listRef.current;
        if (list && followRef.current) list.scrollTop = list.scrollHeight;
    }, [activeConversation?.messages, error]);

    return (
        <section ref={listRef} className="craft-messages" tabIndex={0} aria-label="Chat messages" aria-live="polite" aria-relevant="additions text"
            onScroll={(event) => {
                const list = event.currentTarget;
                followRef.current = list.scrollHeight - list.scrollTop - list.clientHeight < 80;
            }}>
            <div className="craft-messages-content">
            {(activeConversation?.messages ?? []).length === 0 ? (
                <div className="craft-empty">
                    <div className="craft-block mx-auto mb-5" aria-hidden="true"><span /></div>
                    <h3 className="craft-title">What are we building?</h3>
                    <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-zinc-400">A private chat, powered by your browser.<br />Load a model and start exploring.</p>
                    {!isModelReady && <button onClick={loadModel} disabled={loading} className="craft-button craft-button-primary mt-5">{loading ? "Loading model..." : "Load local model"}<span aria-hidden="true">↗</span></button>}
                    <p className="mt-4 text-[11px] text-zinc-600">A lightning local inference.</p>
                </div>
            ) : (activeConversation?.messages ?? []).map((message) => (
                <article key={message.id} className={`craft-message ${message.role === "user" ? "craft-message-user" : "craft-message-assistant"}`}>
                    <div className="craft-label mb-2">{message.role === "user" ? "YOU" : message.role.toUpperCase()}</div>
                    {message.content ? (
                        message.role === "assistant"
                            ? <AssistantMarkdown content={message.content} />
                            : <div className="whitespace-pre-wrap">{message.content}</div>
                    ) : message.status === "streaming" ? <span className="animate-pulse text-zinc-500">Thinking…</span> : null}
                    {message.role === "assistant" && message.benchmark && <ResponsePerformance benchmark={message.benchmark} />}
                </article>
            ))}
            {error && <div role="alert" className="craft-error">{error}</div>}
            </div>
        </section>
    );
}
