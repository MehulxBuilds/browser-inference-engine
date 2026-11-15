import type { ChatController } from "../use-chat";
import { GenerationSettings } from "./generation-settings";

type Props = Pick<ChatController, "conversations" | "activeId" | "setActiveId" | "createChat" | "removeChat" | "generatingConversationId" | "temperature" | "setTemperature" | "maxTokens" | "setMaxTokens" | "generating">;

export function ConversationSidebar({ conversations, activeId, setActiveId, createChat, removeChat, generatingConversationId, ...settings }: Props) {
    return (
            <aside className="craft-sidebar" aria-label="Conversations">
                <div className="mb-6 flex items-center gap-3">
                    <div className="craft-block" aria-hidden="true"><span /></div>
                    <div>
                        <h1 className="craft-brand">Browser LLM<span className="text-primary">_</span></h1>
                        <p className="craft-label mt-2">LOCAL INTELLIGENCE</p>
                    </div>
                </div>
                <button onClick={createChat} className="craft-button craft-button-primary mb-7 w-full text-left">
                    + New conversation
                </button>
                <p className="craft-label mb-3">YOUR CONVERSATIONS <span className="float-right">{String(conversations.length).padStart(2, "0")}</span></p>
                <div className="craft-conversations">
                    {conversations.map((conversation) => (
                        <div key={conversation.id} className={`craft-conversation group ${activeId === conversation.id ? "is-active" : ""}`}>
                            <button aria-current={activeId === conversation.id ? "page" : undefined} onClick={() => setActiveId(conversation.id)} className="min-w-0 flex-1 truncate px-3 py-3 text-left text-sm">
                                {conversation.title}
                            </button>
                            <button disabled={generatingConversationId === conversation.id} onClick={() => removeChat(conversation.id)} aria-label="Delete conversation" className="px-2 text-zinc-500 opacity-0 hover:text-red-400 group-hover:opacity-100 disabled:opacity-30">×</button>
                        </div>
                    ))}
                </div>
                <GenerationSettings {...settings} />
                <div className="craft-sidebar-footer">
                    <span className="craft-label"><span className="craft-dot" /> PRIVATE BY DESIGN</span>
                    <p className="mt-3 text-xs leading-5 text-zinc-500">Your conversations stay in this browser.</p>
                </div>
            </aside>
    );
}
