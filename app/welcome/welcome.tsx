import { inspectGPU } from "~/lib/gpu";
import { useEffect } from "react";

export function Welcome() {
  useEffect(() => {
    inspectGPU();
  }, []);
  return (
    <main className="flex items-center justify-center pt-16 pb-4">
    </main>
  );
}
