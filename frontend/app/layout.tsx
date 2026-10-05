import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "OneAgent — AI Orchestration Workspace",
    template: "%s | OneAgent",
  },
  description:
    "OneAgent automatically analyzes intent, selects the right AI agents, and coordinates AI workflows through one unified workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}