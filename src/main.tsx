import { createRoot } from "react-dom/client";
import { PrivyProvider } from "@privy-io/react-auth";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <PrivyProvider
    appId="cmhszwtsh01r4la0bda59w4q8"
    config={{
      appearance: {
        theme: "dark",
        accentColor: "#5a9372",
      },
    }}
  >
    <App />
  </PrivyProvider>
);
