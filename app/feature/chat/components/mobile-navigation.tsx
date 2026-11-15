import { useEffect, useRef } from "react";
import type { ChatController } from "../use-chat";
import { ConversationSidebar } from "./conversation-sidebar";

type Props = { open: boolean; onClose: () => void; chat: ChatController };

export function MobileNavigation({ open, onClose, chat }: Props) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (open && !dialog?.open) dialog?.showModal();
        if (!open && dialog?.open) dialog.close();
    }, [open]);

    useEffect(() => {
        const media = window.matchMedia("(min-width: 768px)");
        const handleResize = () => { if (media.matches) onClose(); };
        media.addEventListener("change", handleResize);
        return () => media.removeEventListener("change", handleResize);
    }, [onClose]);

    return (
        <dialog ref={dialogRef} id="mobile-navigation" className="craft-navigation-drawer"
            aria-label="Chat navigation" onClose={onClose}
            onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
            <div className="craft-drawer-content">
                <button type="button" autoFocus className="craft-navigation-close" aria-label="Close navigation" onClick={onClose}>×</button>
                <ConversationSidebar {...chat}
                    createChat={() => { chat.createChat(); onClose(); }}
                    setActiveId={(value) => { chat.setActiveId(value); onClose(); }} />
            </div>
        </dialog>
    );
}
