import type { ChatController } from "../use-chat";

type Props = Pick<ChatController, "temperature" | "setTemperature" | "maxTokens" | "setMaxTokens" | "generating">;

export function GenerationSettings({ temperature, setTemperature, maxTokens, setMaxTokens, generating }: Props) {
    return (
        <details className="craft-settings">
            <summary>Generation settings</summary>
            <div className="craft-settings-fields">
                <label>
                    <span>Temperature <output>{temperature.toFixed(1)}</output></span>
                    <input type="range" min="0" max="1.5" step="0.1" value={temperature}
                        disabled={generating} onChange={(event) => setTemperature(Number(event.target.value))} />
                </label>
                <label>
                    <span>Max output tokens</span>
                    <select className="craft-select craft-select-small" value={maxTokens} disabled={generating}
                        onChange={(event) => setMaxTokens(Number(event.target.value))}>
                        {[64, 128, 256, 512].map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                </label>
            </div>
        </details>
    );
}
