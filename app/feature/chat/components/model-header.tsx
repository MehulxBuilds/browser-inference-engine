import type { ChatController } from "../use-chat";
import { SUPPORTED_MODELS } from "../../inference/config";
type Props = Pick<ChatController, "activeConversation" | "status" | "modelId" | "setModelId" | "loading" | "generating" | "device" | "loadedModelId" | "modelSize" | "loadModel" | "progress"> & {
    navigationOpen: boolean;
    onOpenNavigation: () => void;
};

export function ModelHeader({ activeConversation, status, modelId, setModelId, loading, generating, device, loadedModelId, modelSize, loadModel, progress, navigationOpen, onOpenNavigation }: Props) {
    return (
        <>
            <header className="craft-header">
                <div className="craft-header-title">
                    <button type="button" className="craft-menu-button" aria-label="Open chat navigation" aria-controls="mobile-navigation" aria-expanded={navigationOpen} onClick={onOpenNavigation}>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M2 4H16M2 9H16M2 14H16" stroke="currentColor" strokeWidth="2" /></svg>
                    </button>
                    <div className="min-w-0">
                    <h2 className="craft-heading text-base">{activeConversation?.title ?? "Conversation"}</h2>
                    <p className="text-xs text-zinc-500">{status}</p>
                    </div>
                    {device && loadedModelId === modelId && <span className="craft-badge"><span className="craft-dot" />{device.toUpperCase()}</span>}
                </div>
                <div className="craft-model-controls">
                    <select aria-label="Model" value={modelId} disabled={loading || generating}
                        onChange={(event) => setModelId(event.target.value)}
                        className="craft-select max-w-56">
                        {SUPPORTED_MODELS.map((model) => <option key={model.modelId} value={model.modelId}>{model.label}</option>)}
                    </select>
                    <button className="craft-button craft-button-inverse" aria-live="polite"
                        title={modelSize?.bytes ? `Estimated total model files for ${modelSize.device?.toUpperCase()}. Cached files may not need downloading.` : "Model file size"}>
                        {modelSize?.bytes
                            ? `${(modelSize.bytes / 1_000_000).toFixed(1)} MB`
                            : modelSize?.failed ? "Size unavailable" : "Checking size..."}
                    </button>
                    <button onClick={loadModel} disabled={loading || generating || (Boolean(device) && loadedModelId === modelId)} className="craft-button craft-button-primary">
                        {loading ? "Loading..." : device && loadedModelId === modelId ? "Model ready" : "Load model"}
                    </button>
                </div>
            </header>

            {loading && (
                <div className="border-b border-zinc-800 px-5 py-3">
                    <div className="mb-2 flex justify-between text-xs text-zinc-400"><span>Loading model files</span><span>{progress.toFixed(0)}%</span></div>
                    <div className="craft-progress" role="progressbar" aria-label="Model download" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><div style={{ width: `${progress}%` }} /></div>
                </div>
            )}
        </>
    );
}
