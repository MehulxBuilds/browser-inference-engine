import { useChat } from "./feature/chat/use-chat";
import { ConversationSidebar } from "./feature/chat/components/conversation-sidebar";
import { ModelHeader } from "./feature/chat/components/model-header";
import { MessageList } from "./feature/chat/components/message-list";
import { ChatComposer } from "./feature/chat/components/chat-composer";
import { MobileNavigation } from "./feature/chat/components/mobile-navigation";

export default function App() {
    const chat = useChat();
    const [navigationOpen, setNavigationOpen] = useState(false);
    const closeNavigation = useCallback(() => setNavigationOpen(false), []);

    return (
        <div className="craft-app">
            <div className="craft-desktop-navigation"><ConversationSidebar {...chat} /></div>
            <MobileNavigation open={navigationOpen} onClose={closeNavigation} chat={chat} />
            <main className="craft-main">
                <ModelHeader {...chat} navigationOpen={navigationOpen} onOpenNavigation={() => setNavigationOpen(true)} />
                <MessageList {...chat} />
                <ChatComposer {...chat} />
            </main>
        </div>
    );
}
import { useCallback, useState } from "react";
