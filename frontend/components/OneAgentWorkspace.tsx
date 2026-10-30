"use client";

import {
  ArrowUp,
  CheckCircle2,
  Code2,
  Compass,
  FileText,
  Image as ImageIcon,
  Loader2,
  PenLine,
  Plus,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  createConversation,
  getConversation,
  getConversations,
  sendConversationMessage,
  type ChatMessage,
  type Conversation,
  type ConversationDetailResponse,
  type ResearchSource,
  ApiError,
} from "@/lib/api";

type Capability = {
  label: string;
  description: string;
  icon: typeof Compass;
  prompt: string;
};

const capabilities: Capability[] = [
  {
    label: "Research",
    description: "Find and summarize information",
    icon: Compass,
    prompt: "Research this topic and give me a clear summary",
  },
  {
    label: "Coding",
    description: "Solve programming problems",
    icon: Code2,
    prompt: "Help me solve a programming problem",
  },
  {
    label: "Writing",
    description: "Create polished content",
    icon: PenLine,
    prompt: "Help me write something professionally",
  },
  {
    label: "Images",
    description: "Create visual content",
    icon: ImageIcon,
    prompt: "Help me create an image",
  },
  {
    label: "Documents",
    description: "Analyze or summarize files",
    icon: FileText,
    prompt: "Analyze or summarize a document",
  },
];

function formatTokens(message: ChatMessage) {
  if (typeof message.total_tokens === "number") {
    return `${message.total_tokens.toLocaleString()} tokens`;
  }

  if (
    typeof message.input_tokens === "number" &&
    typeof message.output_tokens === "number"
  ) {
    const total =
      message.input_tokens + message.output_tokens;

    return `${total.toLocaleString()} tokens`;
  }

  return null;
}

function formatModelName(model?: string | null) {
  if (!model) {
    return null;
  }

  return model
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getAgentName(agent?: string | null) {
  if (!agent) {
    return null;
  }

  return agent
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function OneAgentWorkspace() {
  const startedNewChat = useRef(false);
  const [conversations, setConversations] = useState<
    Conversation[]
  >([]);

  const [activeConversationId, setActiveConversationId] =
    useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [input, setInput] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("auto");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retryContent, setRetryContent] = useState<string | null>(null);

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null);

  const activeConversation = conversations.find(
    (conversation) =>
      conversation.conversation_id ===
      activeConversationId
  );

  /*
   * Scroll ONLY the chat container.
   */
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });
  }, []);

  /*
 * Load conversations once when the workspace mounts.
 * Select the latest conversation only during initial loading.
 */
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const response = await getConversations();

        setConversations(response.conversations);

        if (
          !startedNewChat.current &&
          response.conversations.length > 0
        ) {
          setActiveConversationId((current) => {
          if (current) return current;

          return response.conversations[0].conversation_id;
        });
      }
    } catch {
      // A fresh chat can still be created.
    }
  };

    void loadConversations();
  }, []);

    

  /*
   * Load the active conversation.
   */
  useEffect(() => {
    if (!activeConversationId) {
      return;
    }

    const loadConversation = async () => {
      try {
        setError("");

        const response: ConversationDetailResponse =
          await getConversation(activeConversationId);

        setMessages(response.messages);

        scrollToBottom();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load this conversation."
        );
      }
    };

    void loadConversation();
  }, [activeConversationId, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  /*
   * Start a new conversation.
   */
  const startNewChat = () => {
  if (loading) return;

  startedNewChat.current = true;

  setActiveConversationId(null);
  setMessages([]);
  setInput("");
  setError("");
};

  /*
   * Create a conversation only when the first
   * message is sent.
   */
  const ensureConversation = async () => {
    if (activeConversationId) {
      return activeConversationId;
    }

    const response = await createConversation("New Chat");

    const conversationId =
      response.conversation_id;

    setActiveConversationId(conversationId);

    setConversations((current) => [
      {
        conversation_id: conversationId,
        title: "New Chat",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      ...current,
    ]);

    return conversationId;
  };

  /*
   * Send message to backend/orchestrator.
   */
  const sendMessage = async (contentOverride?: string) => {
    const content = (contentOverride ?? input).trim();

    if (!content || loading) {
      return;
    }

    setInput("");
    setError("");
    setRetryContent(null);
    setLoading(true);

    const temporaryUserMessage: ChatMessage = {
      id: `temp_user_${Date.now()}`,
      role: "user",
      content,
      model: null,
      agent_id: null,
      input_tokens: null,
      output_tokens: null,
      total_tokens: null,
      task_id: null,
      created_at: new Date().toISOString(),
    };

    setMessages((current) => [
      ...current,
      temporaryUserMessage,
    ]);

    try {
      const conversationId =
        await ensureConversation();

      const response =
        await sendConversationMessage(
          conversationId,
          content,
          selectedAgent
        );

      setMessages((current) => {
        const withoutTemporary =
          current.filter(
            (message) =>
              message.id !==
              temporaryUserMessage.id
          );

        return [
          ...withoutTemporary,
          response.user_message,
          response.assistant_message,
        ];
      });

      setConversations((current) =>
        current.map((conversation) =>
          conversation.conversation_id ===
          conversationId
            ? {
                ...conversation,
                updated_at:
                  response.assistant_message
                    .created_at,
              }
            : conversation
        )
      );
    } catch (err) {
      setMessages((current) =>
        current.filter(
          (message) =>
            message.id !==
            temporaryUserMessage.id
        )
      );

      setError(
        err instanceof Error
          ? err.message
          : "OneAgent could not complete this task."
      );
      if (
        err instanceof ApiError &&
        (err.status === 429 || err.status >= 500)
      ) {
        setRetryContent(content);
      }
    } finally {
      setLoading(false);
    }
  };

  const selectCapability = (prompt: string) => {
    if (loading) {
      return;
    }

    setInput(prompt);
  };

  const hasMessages = messages.length > 0;

  return (
    /*
     * IMPORTANT:
     *
     * h-[calc(100dvh-64px)]
     * = viewport height minus the main application header.
     *
     * overflow-hidden
     * = the OUTER PAGE NEVER SCROLLS.
     */
    <div className="flex h-[calc(100dvh-64px)] w-full overflow-hidden bg-background">
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">

        {/* ================================================= */}
        {/* HEADER - FIXED                                    */}
        {/* ================================================= */}

        <header className="flex h-16 shrink-0 items-center border-b border-border bg-card/80 px-5 backdrop-blur">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-semibold text-primary">
              {activeConversation?.title ||
                "New Chat"}
            </div>

            <div className="text-[12px] text-faint">
              OneAgent
            </div>
          </div>

          <button
            type="button"
            onClick={startNewChat}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-[13px] font-medium text-muted transition-colors hover:border-[#D97706]/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={15} />
            New chat
          </button>
        </header>

        {/* ================================================= */}
        {/* MAIN BODY                                          */}
        {/* ================================================= */}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">

          {/* =============================================== */}
          {/* CHAT AREA - THIS IS THE ONLY SCROLLABLE AREA     */}
          {/* =============================================== */}

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-5 py-6 sm:px-8">

              {!hasMessages ? (
                /* ========================================== */
                /* EMPTY CHAT                                  */
                /* ========================================== */

                <div className="flex flex-1 flex-col items-center justify-center py-6">

                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
                    <Sparkles
                      size={22}
                      strokeWidth={1.8}
                      className="text-[#D97706]"
                    />
                  </div>

                  <h1 className="text-center text-[32px] font-semibold tracking-[-0.025em] text-primary">
                    What can I help you accomplish?
                  </h1>

                  <p className="mt-3 max-w-2xl text-center text-[16px] leading-7 text-muted">
                    Ask OneAgent anything. Each message is
                    analyzed independently and routed to the
                    best available agent and model.
                  </p>

                  <div className="mt-8 grid w-full max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
                    {capabilities
                      .slice(0, 4)
                      .map((capability) => {
                        const Icon =
                          capability.icon;

                        return (
                          <button
                            key={capability.label}
                            type="button"
                            onClick={() =>
                              selectCapability(
                                capability.prompt
                              )
                            }
                            disabled={loading}
                            className="rounded-xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#D97706]/40 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFF7ED]">
                              <Icon
                                size={18}
                                className="text-[#D97706]"
                              />
                            </div>

                            <div className="mt-3 text-[14px] font-semibold text-primary">
                              {capability.label}
                            </div>

                            <div className="mt-1.5 text-[12px] leading-5 text-faint">
                              {
                                capability.description
                              }
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              ) : (
                /* ========================================== */
                /* CONVERSATION                                */
                /* ========================================== */

                <div className="space-y-8 pb-6">

                  {messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                    />
                  ))}

                  {loading && (
                    <div className="flex gap-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                        <Sparkles size={17} />
                      </div>

                      <div className="rounded-2xl rounded-tl-md border border-border bg-card px-5 py-4">
                        <div className="flex items-center gap-3">

                          <div className="flex gap-1">
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D97706]" />

                            <span
                              className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D97706]"
                              style={{
                                animationDelay:
                                  "100ms",
                              }}
                            />

                            <span
                              className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D97706]"
                              style={{
                                animationDelay:
                                  "200ms",
                              }}
                            />
                          </div>

                          <span className="text-[14px] text-muted">
                            OneAgent is thinking...
                          </span>

                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}

              {error && (
                <div
                  className="mt-4 shrink-0 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[14px] leading-6 text-[#B91C1C]"
                  role="alert"
                >
                  <div>{error}</div>
                  {retryContent && (
                    <button
                      type="button"
                      onClick={() => void sendMessage(retryContent)}
                      disabled={loading}
                      className="mt-2 rounded-lg border border-[#B91C1C]/30 px-3 py-1.5 text-[12px] font-medium hover:bg-[#FEE2E2] disabled:opacity-50"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* =============================================== */}
          {/* COMPOSER - FIXED AT BOTTOM                       */}
          {/* =============================================== */}

          <div className="shrink-0 bg-gradient-to-t from-background via-background to-transparent px-5 pb-4 pt-2 sm:px-8">
            <div className="mx-auto w-full max-w-5xl">

              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all focus-within:border-[#D97706]/60 focus-within:shadow-[0_0_0_3px_rgba(217,119,6,0.06)]">

                <textarea
                  value={input}
                  onChange={(event) =>
                    setInput(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey
                    ) {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                  disabled={loading}
                  rows={2}
                  placeholder="Message OneAgent..."
                  aria-label="Message OneAgent"
                  className="block max-h-32 min-h-[64px] w-full resize-none border-0 bg-transparent px-5 pt-4 text-[16px] leading-7 text-primary outline-none placeholder:text-faint disabled:opacity-60"
                />

                <div className="flex items-center justify-between px-4 pb-3 pt-1">

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-[12px] text-faint">
                      <span>Agent</span>
                      <select
                        value={selectedAgent}
                        onChange={(event) =>
                          setSelectedAgent(event.target.value)
                        }
                        disabled={loading}
                        aria-label="Select agent"
                        className="rounded-lg border border-border bg-background px-2 py-1 text-[12px] text-primary outline-none focus:border-[#D97706]/60"
                      >
                        <option value="auto">Auto</option>
                        <option value="research">Research</option>
                        <option value="coding">Coding</option>
                        <option value="writing">Writing</option>
                        <option value="document">Documents</option>
                      </select>
                    </label>

                    <span className="hidden text-[12px] text-faint sm:inline">
                      Enter to send · Shift + Enter for a new line
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void sendMessage()
                    }
                    disabled={
                      !input.trim() || loading
                    }
                    aria-label="Send message"
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-25"
                  >
                    {loading ? (
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                    ) : (
                      <ArrowUp
                        size={19}
                        strokeWidth={2.2}
                      />
                    )}
                  </button>

                </div>
              </div>

              <div className="mt-1.5 text-center text-[11px] text-faint">
                OneAgent can make mistakes. Verify important
                information.
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}


/* ========================================================= */
/* MESSAGE BUBBLE                                            */
/* ========================================================= */

function MessageBubble({
  message,
}: {
  message: ChatMessage;
}) {
  const isUser = message.role === "user";

  /* ------------------------------------------------------- */
  /* USER MESSAGE                                            */
  /* ------------------------------------------------------- */

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[82%] rounded-2xl rounded-br-md bg-primary px-5 py-3.5 text-[15px] leading-7 text-white shadow-sm">
          <div className="whitespace-pre-wrap">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  const model = formatModelName(message.model);
  const agent = getAgentName(message.agent_id);
  const tokens = formatTokens(message);
  const metadata = message.metadata;
  const search = metadata?.search;
  const sources: ResearchSource[] =
    search?.sources ??
    (metadata?.result?.metadata as {
      sources?: ResearchSource[];
    } | undefined)?.sources ??
    [];

  /* ------------------------------------------------------- */
  /* ASSISTANT MESSAGE                                       */
  /* ------------------------------------------------------- */

  return (
    <div className="flex gap-3.5">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
        <Sparkles size={17} />
      </div>

      <div className="min-w-0 flex-1">

        {/* Assistant header */}
        <div className="mb-2 flex items-center gap-2">

          <span className="text-[14px] font-semibold text-primary">
            OneAgent
          </span>

          {metadata?.status === "failed" ||
          metadata?.result?.status === "failed" ? (
            <span className="text-[11px] font-medium text-[#B91C1C]">
              Failed
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-medium text-[#15803D]">
              <CheckCircle2 size={12} />
              Completed
            </span>
          )}

        </div>

        {search && (
          <div className="mt-3 rounded-xl border border-border bg-background px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
              <span className="font-semibold text-primary">
                Web search
              </span>
              <span className="text-muted">
                {search.status === "completed"
                  ? `${search.results_count ?? sources.length} sources used`
                  : search.status === "missing_key"
                    ? "Tavily key not configured"
                    : search.status === "no_results"
                      ? "No sources found"
                      : search.status === "timeout"
                        ? "Search timed out"
                        : search.status === "failed"
                          ? "Search failed"
                          : "Not requested"}
              </span>
            </div>

            {sources.length > 0 && (
              <div className="mt-2 flex flex-col gap-1">
                {sources.map((source, index) => (
                  <a
                    key={`${source.url}-${index}`}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-[12px] font-medium text-[#B45309] underline underline-offset-2 hover:text-[#92400E]"
                  >
                    [{index + 1}] {source.title || source.url}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================= */}
        {/* MARKDOWN RESPONSE                                  */}
        {/* ================================================= */}

        <div className="rounded-2xl rounded-tl-md border border-border bg-card px-5 py-4 text-[15px] leading-7 text-[#374151] shadow-sm">

          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{

              /* ---------------- HEADINGS ---------------- */

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

              /* ---------------- PARAGRAPHS ---------------- */

              p: ({ children }) => (
                <p className="mb-4 last:mb-0">
                  {children}
                </p>
              ),

              /* ---------------- LISTS ---------------- */

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

              li: ({ children }) => (
                <li className="pl-1">
                  {children}
                </li>
              ),

              /* ---------------- TEXT ---------------- */

              strong: ({ children }) => (
                <strong className="font-bold text-primary">
                  {children}
                </strong>
              ),

              em: ({ children }) => (
                <em className="italic">
                  {children}
                </em>
              ),

              /* ---------------- QUOTE ---------------- */

              blockquote: ({ children }) => (
                <blockquote className="my-4 border-l-4 border-[#D97706] bg-[#FFFBF5] px-4 py-3 italic text-muted">
                  {children}
                </blockquote>
              ),

              /* ---------------- CODE ---------------- */

              code: ({
                className,
                children,
              }) => {
                const isCodeBlock =
                  Boolean(className?.startsWith("language-")) ||
                  String(children).includes("\n");

                if (isCodeBlock) {
                  return (
                    <code
                      className={`${className} block overflow-x-auto rounded-lg bg-[#111827] p-4 font-mono text-[13px] leading-6 text-white`}
                    >
                      {children}
                    </code>
                  );
                }

                return (
                  <code className="rounded-md bg-[#F3F4F6] px-1.5 py-0.5 font-mono text-[13px] text-[#B45309]">
                    {children}
                  </code>
                );
              },

              pre: ({ children }) => (
                <pre className="my-4 overflow-x-auto rounded-lg">
                  {children}
                </pre>
              ),

              /* ---------------- LINKS ---------------- */

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

              /* ---------------- DIVIDER ---------------- */

              hr: () => (
                <hr className="my-5 border-border" />
              ),

              /* ================================================= */
              /* TABLES                                             */
              /* ================================================= */

              table: ({ children }) => (
                <div className="my-5 w-full overflow-x-auto rounded-xl border border-border">
                  <table className="w-full min-w-[550px] border-collapse text-left text-[14px]">
                    {children}
                  </table>
                </div>
              ),

              thead: ({ children }) => (
                <thead className="bg-[#F9FAFB]">
                  {children}
                </thead>
              ),

              tbody: ({ children }) => (
                <tbody className="divide-y divide-border">
                  {children}
                </tbody>
              ),

              tr: ({ children }) => (
                <tr className="transition-colors hover:bg-[#FAFAFA]">
                  {children}
                </tr>
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
            {message.content}
          </ReactMarkdown>

        </div>

        {/* ================================================= */}
        {/* MODEL / AGENT / TOKEN INFORMATION                 */}
        {/* ================================================= */}

        {(model || agent || tokens) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 px-1 text-[11px] text-faint">

            {model && (
              <span>
                {model}
              </span>
            )}

            {agent && (
              <>
                <span>·</span>
                <span>
                  {agent}
                </span>
              </>
            )}

            {tokens && (
              <>
                <span>·</span>
                <span>
                  {tokens}
                </span>
              </>
            )}

            {message.task_id && (
              <>
                <span>·</span>

                <Link
                  href="/history"
                  className="hover:text-[#B45309] hover:underline"
                >
                  View task
                </Link>
              </>
            )}

          </div>
        )}

      </div>
    </div>
  );
}