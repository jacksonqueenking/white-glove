import type { ReactNode } from "react";
import { AppShell } from "../../components/layout/AppShell";

// Venue dashboard layout with Claude-style navigation, anchored chat, and event management.
export default function VenueLayout({ children }: { children: ReactNode }) {
  return <AppShell mode="venue">{children}</AppShell>;
}
