"use client";

import { createClient } from "@/lib/supabase/client";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type ApiKeyProvider =
  | "openai"
  | "gemini"
  | "groq"
  | "grok"
  | "tavily";

export type ApiKeyStatus = {
  provider: ApiKeyProvider;
  configured: boolean;
  updated_at?: string | null;
};

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const supabase = createClient();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  if (!session?.access_token) {
    throw new Error("Please sign in again to manage API keys.");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.detail || data.message || `Request failed (${response.status})`
    );
  }

  return data as T;
}

export async function getApiKeyStatuses(): Promise<ApiKeyStatus[]> {
  const result = await request<
    { api_keys?: ApiKeyStatus[]; providers?: ApiKeyStatus[] } | ApiKeyStatus[]
  >("/api/settings/api-keys");

  return Array.isArray(result)
    ? result
    : result.api_keys ?? result.providers ?? [];
}

export function saveApiKey(
  provider: ApiKeyProvider,
  api_key: string
) {
  return request(`/api/settings/api-keys/${provider}`, {
    method: "PUT",
    body: JSON.stringify({ api_key }),
  });
}

export function deleteApiKey(provider: ApiKeyProvider) {
  return request(`/api/settings/api-keys/${provider}`, {
    method: "DELETE",
  });
}