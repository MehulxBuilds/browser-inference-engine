// async function inspectTransformersCache() {
//     const cacheName = "transformers-cache";

//     const cacheNames = await caches.keys();

//     console.log("Available caches:", cacheNames);

//     if (!cacheNames.includes(cacheName)) {
//         console.warn("Transformers cache not found.");
//         return;
//     }

//     const cache = await caches.open(cacheName);
//     const requests = await cache.keys();

//     const files = requests.map((request) => {
//         const url = new URL(request.url);

//         return {
//             filename: url.pathname.split("/").pop(),
//             url: request.url,
//             isONNX: url.pathname.endsWith(".onnx"),
//             isTokenizer:
//                 url.pathname.toLowerCase().includes("tokenizer"),
//         };
//     });

//     console.log("Total cached resources:", files.length);
//     console.table(files);

//     console.log(
//         "ONNX files:",
//         files.filter((file) => file.isONNX),
//     );

//     console.log(
//         "Tokenizer files:",
//         files.filter((file) => file.isTokenizer),
//     );

//     return files;
// }

// async function inspectStorageUsage() {
//     if (!navigator.storage?.estimate) {
//         console.warn("Storage estimate API unavailable.");
//         return;
//     }

//     const estimate = await navigator.storage.estimate();

//     console.log({
//         usageMB: (
//             (estimate.usage ?? 0) / 1024 / 1024
//         ).toFixed(2),

//         quotaMB: (
//             (estimate.quota ?? 0) / 1024 / 1024
//         ).toFixed(2),
//     });
// }

// async function main() {
//     await inspectTransformersCache();
//     await inspectStorageUsage();
// }

// main();
