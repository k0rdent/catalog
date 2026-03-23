import { createRoot } from "react-dom/client";

try {
  const { default: App } = await import("./k0rdent_catalog.tsx");
  createRoot(document.getElementById("root")!).render(<App />);
} catch (e) {
  document.getElementById("root")!.innerHTML =
    '<pre style="color:red;padding:20px;font-size:14px">' +
    String(e) + "\n\n" + (e as Error).stack +
    "</pre>";
  console.error(e);
}
