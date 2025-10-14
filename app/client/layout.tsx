import type { ReactNode } from "react";
import { AppShell } from "../../components/layout/AppShell";

// Client persona layout with Claude-style navigation, anchored chat, and event detail pane.
export default function ClientLayout({ children }: { children: ReactNode }) {
  return <AppShell mode="client">{children}</AppShell>;
}
