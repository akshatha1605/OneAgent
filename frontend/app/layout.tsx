import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OneAgent — AI Orchestration Workspace",
  description:
    "OneAgent automatically analyzes intent, selects the right AI agents, and coordinates multi-agent workflows through one interface.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
