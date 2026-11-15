import { useId, useRef } from "react";
import type { ResponseBenchmark } from "../../inference/benchmark";
import { SUPPORTED_MODELS } from "../../inference/config";

export function ResponsePerformance({ benchmark }: { benchmark: ResponseBenchmark }) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const model = SUPPORTED_MODELS.find((item) => item.modelId === benchmark.modelId);
    const seconds = (ms: number) => `${(ms / 1000).toFixed(2)} s`;
    const values = [
        ["Time to first token", benchmark.ttftMs === null ? "No token produced" : seconds(benchmark.ttftMs)],
        ["Total time", seconds(benchmark.totalMs)],
        ["Output throughput", `${benchmark.tokensPerSecond.toFixed(1)} tok/s`],
        ["Prompt tokens", benchmark.promptTokens?.toLocaleString() ?? "Unavailable"],
        ["Generated tokens", benchmark.generatedTokens.toLocaleString()],
        ["Result", benchmark.outcome],
        ["Runtime", `${benchmark.device.toUpperCase()} / ${benchmark.dtype}`],
        ["Temperature", String(benchmark.settings.temperature)],
        ["Max output tokens", String(benchmark.settings.maxNewTokens)],
    ];
    return (
        <>
            <button type="button" className="craft-performance-button" aria-haspopup="dialog"
                onClick={() => dialogRef.current?.showModal()}>Performance ↗</button>
            <dialog ref={dialogRef} className="craft-performance-dialog" aria-labelledby={titleId}
                onClick={(event) => {
                    if (event.target !== event.currentTarget) return;
                    const rect = event.currentTarget.getBoundingClientRect();
                    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialogRef.current?.close();
                }}>
                <div className="craft-performance-heading">
                    <h2 id={titleId} className="craft-heading">Response performance</h2>
                    <button type="button" autoFocus aria-label="Close performance details" onClick={() => dialogRef.current?.close()}>×</button>
                </div>
                <p className="craft-performance-model">{model?.label ?? benchmark.modelId}</p>
                <dl className="craft-performance-grid">
                    {values.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
                </dl>
                <p className="craft-performance-note">Measured once on this device.</p>
                <p className="craft-performance-note">Recorded {new Date(benchmark.measuredAt).toLocaleString()}. Saved locally with this conversation.</p>
            </dialog>
        </>
    );
}
