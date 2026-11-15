import { useEffect, useState, type RefObject } from "react";
import type { InferenceWorkerClient } from "./worker-client";

type ModelSize = { modelId: string; bytes: number | null; device?: string; failed: boolean };

export function useModelSize(clientRef: RefObject<InferenceWorkerClient | null>, modelId: string) {
    const [result, setResult] = useState<ModelSize | null>(null);

    useEffect(() => {
        const client = clientRef.current;
        if (!client) return;
        const requestId = crypto.randomUUID();
        const unsubscribe = client.subscribe((message) => {
            if (message.requestId !== requestId) return;
            if (message.type === "MODEL_SIZE") {
                setResult({ modelId, bytes: message.totalSize > 0 ? message.totalSize : null, device: message.device, failed: message.totalSize <= 0 });
            } else if (message.type === "ERROR") {
                setResult({ modelId, bytes: null, failed: true });
            }
        });
        client.post({ type: "INSPECT", requestId, modelId });
        return unsubscribe;
    }, [clientRef, modelId]);

    return result?.modelId === modelId ? result : null;
}
