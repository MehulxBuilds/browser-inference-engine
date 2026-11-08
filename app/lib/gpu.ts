export async function inspectGPU() {
    console.log("=== Browser LLM Lab ===");

    // 1. Check WebGPU availability
    if (!navigator.gpu) {
        console.error("WebGPU is not available in this browser.");
        return;
    }

    console.log("WebGPU is available!");

    // 2. Discover GPU adapter
    const adapter = await navigator.gpu.requestAdapter();

    if (!adapter) {
        console.error("No GPU adapter found.");
        return;
    }

    console.log("GPU adapter discovered!");

    // 3. Inspect adapter capabilities
    const adapterLimits = adapter.limits;

    console.log("\n=== Adapter Limits ===");

    console.table({
        maxBufferSize: adapterLimits.maxBufferSize,
        maxStorageBufferBindingSize:
            adapterLimits.maxStorageBufferBindingSize,
        maxComputeWorkgroupSizeX:
            adapterLimits.maxComputeWorkgroupSizeX,
        maxComputeInvocationsPerWorkgroup:
            adapterLimits.maxComputeInvocationsPerWorkgroup,
        maxComputeWorkgroupsPerDimension:
            adapterLimits.maxComputeWorkgroupsPerDimension,
    });

    // 4. Create logical GPU device
    const device = await adapter.requestDevice();

    console.log("\nGPU device successfully created!");

    // 5. Inspect actual device limits
    console.log("\n=== Device Limits ===");

    console.table({
        maxBufferSize: device.limits.maxBufferSize,
        maxStorageBufferBindingSize:
            device.limits.maxStorageBufferBindingSize,
        maxComputeWorkgroupSizeX:
            device.limits.maxComputeWorkgroupSizeX,
        maxComputeInvocationsPerWorkgroup:
            device.limits.maxComputeInvocationsPerWorkgroup,
    });

    // 6. Inspect supported GPU features
    console.log("\n=== GPU Features ===");

    console.log([...adapter.features]);

    // 7. Monitor device loss
    device.lost.then((info) => {
        console.error("GPU device lost:", info.message);
    });

    console.log("\nGPU initialization complete!");
}

inspectGPU().catch(console.error);