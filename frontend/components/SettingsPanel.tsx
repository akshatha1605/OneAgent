"use client";

import { useState } from "react";
import { KeyRound, Bell, User, Eye, EyeOff, RotateCw } from "lucide-react";

const apiKeys = [
  { name: "OpenAI", key: "sk-proj-••••••••••••7f2a" },
  { name: "Anthropic", key: "sk-ant-••••••••••••91bd" },
  { name: "Google Gemini", key: "AIza••••••••••••••c03e" },
  { name: "Tavily", key: "tvly-••••••••••••4e19" },
];

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={15} className="text-accent" />
        <h3 className="text-[13px] font-semibold text-primary">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      onClick={() => setOn(!on)}
      className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${
        on ? "bg-accent" : "bg-[#E5E5E5]"
      }`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
          on ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function SettingsPanel() {
  const [visibleKey, setVisibleKey] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <Section icon={User} title="Profile">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary text-white text-[15px] font-semibold flex items-center justify-center">
            AK
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              defaultValue="Arjun Kumar"
              className="rounded-md border border-border bg-background px-3 py-2 text-[13px] text-primary outline-none focus:border-accent"
            />
            <input
              defaultValue="arjun@oneagent.dev"
              className="rounded-md border border-border bg-background px-3 py-2 text-[13px] text-primary outline-none focus:border-accent"
            />
          </div>
        </div>
      </Section>

      <Section icon={KeyRound} title="API Keys">
        <div className="flex flex-col gap-2.5">
          {apiKeys.map((k) => (
            <div
              key={k.name}
              className="flex items-center justify-between rounded-lg border border-[#F0F0EE] bg-background px-3 py-2.5"
            >
              <div>
                <div className="text-[12.5px] font-medium text-primary">{k.name}</div>
                <div className="text-[11.5px] text-faint font-mono mt-0.5">
                  {visibleKey === k.name ? k.key.replace(/•/g, "x") : k.key}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setVisibleKey(visibleKey === k.name ? null : k.name)}
                  className="p-1.5 rounded-md hover:bg-[#F0F0EE] text-muted"
                >
                  {visibleKey === k.name ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button className="p-1.5 rounded-md hover:bg-[#F0F0EE] text-muted">
                  <RotateCw size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={Bell} title="Notifications">
        <div className="flex flex-col gap-3.5">
          {[
            ["Workflow completed", true],
            ["Workflow failed", true],
            ["Weekly usage summary", false],
            ["New agent connected", false],
          ].map(([label, def]) => (
            <div key={label as string} className="flex items-center justify-between">
              <span className="text-[12.5px] text-[#374151]">{label as string}</span>
              <Toggle defaultOn={def as boolean} />
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
