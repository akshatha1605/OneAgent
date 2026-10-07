"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownRendererProps = {
  content: string;
};

export default function MarkdownRenderer({
  content,
}: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="mb-4 mt-1 text-[25px] font-bold leading-tight text-primary">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-3 mt-6 text-[21px] font-bold leading-tight text-primary">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-2 mt-5 text-[18px] font-semibold text-primary">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="mb-4 last:mb-0">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="mb-4 ml-6 list-disc space-y-1.5">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-4 ml-6 list-decimal space-y-1.5">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="pl-1">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-bold text-primary">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        blockquote: ({ children }) => (
          <blockquote className="my-4 border-l-4 border-[#D97706] bg-[#FFFBF5] px-4 py-3 italic text-muted">
            {children}
          </blockquote>
        ),
        code: ({ className, children }) => {
          const isCodeBlock =
            Boolean(className?.startsWith("language-")) ||
            String(children).includes("\n");

          return isCodeBlock ? (
            <code
              className={`${className ?? ""} block overflow-x-auto rounded-lg bg-[#111827] p-4 font-mono text-[13px] leading-6 text-white`}
            >
              {children}
            </code>
          ) : (
            <code className="rounded-md bg-[#F3F4F6] px-1.5 py-0.5 font-mono text-[13px] text-[#B45309]">
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="my-4 overflow-x-auto rounded-lg">{children}</pre>
        ),
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#B45309] underline underline-offset-2 hover:text-[#92400E]"
          >
            {children}
          </a>
        ),
        hr: () => <hr className="my-5 border-border" />,
        table: ({ children }) => (
          <div className="my-5 w-full overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[550px] border-collapse text-left text-[14px]">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-[#F9FAFB]">{children}</thead>
        ),
        tbody: ({ children }) => (
          <tbody className="divide-y divide-border">{children}</tbody>
        ),
        tr: ({ children }) => (
          <tr className="transition-colors hover:bg-[#FAFAFA]">{children}</tr>
        ),
        th: ({ children }) => (
          <th className="border-b border-border px-4 py-3 text-[13px] font-semibold text-primary">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border-b border-border px-4 py-3 align-top text-[13px] leading-6 text-[#4B5563]">
            {children}
          </td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
