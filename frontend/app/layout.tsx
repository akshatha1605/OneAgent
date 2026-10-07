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
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full overflow-hidden"
    >
      <body className="h-full w-full overflow-hidden">
        <div className="h-full w-full min-h-0 min-w-0 overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}