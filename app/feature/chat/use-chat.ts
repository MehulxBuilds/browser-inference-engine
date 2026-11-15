import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Conversation, ChatMessage } from "./types";
import { deleteConversation, getConversations, saveConversation } from "./storage";
import { InferenceWorkerClient } from "../inference/worker-client";
import type { WorkerResponse } from "../inference/protocol";
import { MODEL_CONFIG } from "../inference/config";
import { useModelSize } from "../inference/use-model-size";

function id() {
    return crypto.randomUUID();
}

function newConversation(): Conversation {
    const now = Date.now();
    return { id: id(), title: "New conversation", messages: [], createdAt: now, updatedAt: now };
}

export function useChat() {
    const clientRef = useRef<InferenceWorkerClient | null>(null);
    const activeGenerationRef = useRef<{ requestId: string; conversationId: string; messageId: string } | null>(null);
    const loadRequestRef = useRef<string | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeId, setActiveId] = useState<string>("");
    const [input, setInput] = useState("");
    const [status, setStatus] = useState("Model not loaded");
    const [progress, setProgress] = useState(0);
    const [device, setDevice] = useState<"webgpu" | "wasm" | null>(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState("");
    const [temperature, setTemperature] = useState(0.7);
    const [maxTokens, setMaxTokens] = useState(256);
    const [modelId, setModelId] = useState(MODEL_CONFIG.modelId);
    const [loadedModelId, setLoadedModelId] = useState<string | null>(null);
    const conversationsRef = useRef(conversations);
    conversationsRef.current = conversations;

    const commitConversation = useCallback((updated: Conversation, persist = true) => {
        const next = [updated, ...conversationsRef.current.filter((c) => c.id !== updated.id)]
            .sort((a, b) => b.updatedAt - a.updatedAt);
        conversationsRef.current = next;
        setConversations(next);
        if (persist) void saveConversation(updated).catch((err) => setError(err instanceof Error ? err.message : "Could not save chat."));
    }, []);

    const activeConversation = useMemo(
        () => conversations.find((c) => c.id === activeId) ?? null,
        [conversations, activeId],
    );

    useEffect(() => {
        let mounted = true;
        const client = new InferenceWorkerClient();
        clientRef.current = client;

        const unsubscribe = client.subscribe((message: WorkerResponse) => {
            if (!mounted) return;
            const generation = activeGenerationRef.current;
            const isGeneration = message.requestId === generation?.requestId;
            const isLoad = message.requestId === loadRequestRef.current;
            if (!isGeneration && !isLoad) return;

            if (message.type === "STATUS") setStatus(message.message);
            if (message.type === "PROGRESS") setProgress(message.progress);
            if (message.type === "READY") {
                setDevice(message.device);
                setLoadedModelId(message.modelId);
                loadRequestRef.current = null;
                setLoading(false);
                setStatus(`Ready · ${message.device.toUpperCase()}`);
            }
            if (message.type === "ERROR") {
                setError(message.message);
                setLoading(false);
                setGenerating(false);
                setStatus("Error");
                if (isLoad) {
                    loadRequestRef.current = null;
                    setDevice(null);
                    setLoadedModelId(null);
                }
            }
            if (generation && isGeneration && (message.type === "TOKEN" || message.type === "DONE" || message.type === "ERROR")) {
                const conversation = conversationsRef.current.find((c) => c.id === generation.conversationId);
                if (conversation) {
                    const messages = conversation.messages.map((item): ChatMessage => {
                        if (item.id !== generation.messageId) return item;
                        if (message.type === "TOKEN") return { ...item, content: item.content + message.token };
                        if (message.type === "ERROR") return { ...item, status: "error", benchmark: message.benchmark };
                        return { ...item, content: message.generatedText, status: message.cancelled ? "cancelled" : "complete", benchmark: message.benchmark };
                    });
                    commitConversation({ ...conversation, messages, updatedAt: Date.now() }, message.type !== "TOKEN");
                }
                if (message.type !== "TOKEN") {
                    setGenerating(false);
                    activeGenerationRef.current = null;
                    if (message.type === "DONE") setStatus(message.cancelled ? "Generation stopped" : "Ready");
                }
            }
        });

        void getConversations().then((items) => {
            if (!mounted) return;
            if (items.length) {
                const recovered = items.map((item) => ({ ...item, messages: item.messages.map((message): ChatMessage => message.status === "streaming" ? { ...message, status: "cancelled" } : message) }));
                conversationsRef.current = recovered;
                setConversations(recovered);
                setActiveId(items[0].id);
            } else {
                const conversation = newConversation();
                commitConversation(conversation);
                setActiveId(conversation.id);
            }
        }).catch((e) => { if (mounted) setError(e instanceof Error ? e.message : "Could not load chat history."); });

        return () => {
            mounted = false;
            unsubscribe();
            client.dispose();
            clientRef.current = null;
        };
    }, [commitConversation]);

    const modelSize = useModelSize(clientRef, modelId);
    const isModelReady = Boolean(device) && loadedModelId === modelId && !loading;

    const loadModel = () => {
        if (!clientRef.current || loadRequestRef.current || activeGenerationRef.current) return;
        setError("");
        setLoading(true);
        setProgress(0);
        const requestId = id();
        loadRequestRef.current = requestId;
        setDevice(null);
        setLoadedModelId(null);
        clientRef.current.post({
            type: "LOAD",
            requestId,
            modelId,
            preferredDevice: "auto",
        });
    };

    const createChat = () => {
        const conversation = newConversation();
        commitConversation(conversation);
        setActiveId(conversation.id);
    };

    const sendMessage = () => {
        const content = input.trim();
        if (!content || activeGenerationRef.current || !isModelReady || !clientRef.current || !activeConversation) return;

        const userMessage: ChatMessage = {
            id: id(), role: "user", content, createdAt: Date.now(), status: "complete",
        };
        const assistantMessage: ChatMessage = {
            id: id(), role: "assistant", content: "", createdAt: Date.now(), status: "streaming",
        };

        const messages = [...activeConversation.messages, userMessage, assistantMessage];
        const updated: Conversation = {
            ...activeConversation,
            title: activeConversation.messages.length === 0 ? content.slice(0, 42) : activeConversation.title,
            messages,
            updatedAt: Date.now(),
        };
        commitConversation(updated);
        setInput("");
        setGenerating(true);
        setError("");

        const requestId = id();
        activeGenerationRef.current = { requestId, conversationId: activeConversation.id, messageId: assistantMessage.id };
        const context = [...activeConversation.messages.filter((m) => m.status === "complete"), userMessage]
            .map(({ role, content: text }) => ({ role, content: text }));

        clientRef.current.post({
            type: "GENERATE",
            requestId,
            modelId,
            messages: context,
            maxNewTokens: maxTokens,
            temperature,
        });
    };

    const stopGeneration = () => {
        const requestId = activeGenerationRef.current?.requestId;
        if (requestId && clientRef.current) {
            clientRef.current.post({ type: "STOP", requestId });
            setStatus("Stopping generation...");
        }
    };

    const removeChat = async (conversationId: string) => {
        if (activeGenerationRef.current?.conversationId === conversationId) return;
        await deleteConversation(conversationId);
        const remaining = conversations.filter((c) => c.id !== conversationId);
        conversationsRef.current = remaining;
        if (remaining.length === 0) {
            const fresh = newConversation();
            commitConversation(fresh);
            setActiveId(fresh.id);
        } else {
            setConversations(remaining);
            if (activeId === conversationId) setActiveId(remaining[0].id);
        }
    };

    return {
        conversations, activeId, setActiveId, activeConversation,
        input, setInput,
        status: !loading && loadedModelId !== modelId && !error ? "Selected model not loaded" : status,
        progress, device, isModelReady, loading, generating, error,
        temperature, setTemperature, maxTokens, setMaxTokens,
        modelId, setModelId, loadedModelId, modelSize, loadModel, createChat,
        sendMessage, stopGeneration,
        generatingConversationId: generating ? activeGenerationRef.current?.conversationId ?? null : null,
        removeChat: (conversationId: string) => {
            void removeChat(conversationId).catch((err) =>
                setError(err instanceof Error ? err.message : "Could not delete chat."));
        },
    };
}

export type ChatController = ReturnType<typeof useChat>;
