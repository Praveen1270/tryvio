"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, X, RotateCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProjectGeneration } from "@/lib/types";
import { streamGeneration, type GenStage } from "@/lib/ai/streamClient";
import { isAbortError } from "@/lib/ai/providerErrors";
import { getLocalProject } from "@/lib/store/localProjects";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  kind: "normal" | "activity" | "error";
}

interface AIChatProps {
  boardId: string;
  projectId: string;
  generation: ProjectGeneration | null;
  initialPrompt?: string;
  /** True when this project has no stored generation yet — auto-start once. */
  autoStart: boolean;
  onStage: (stage: GenStage) => void;
  onProgress: (chars: number, elapsedMs: number) => void;
  onSpec: (gen: ProjectGeneration) => void;
  onDone: (gen: ProjectGeneration) => void;
  /** Increment to retry the last request from outside (e.g. workspace error banner). */
  retrySignal: number;
  onClose: () => void;
}

function summaryFor(gen: ProjectGeneration, isFollowUp: boolean): string {
  const board = gen.board?.name || "board";
  const count = gen.components?.length ?? 0;
  if (isFollowUp) {
    return `Updated the ${board} configuration — pin mapping, wiring and firmware are in sync.`;
  }
  const names = (gen.components || []).map((c) => c.name).filter(Boolean).slice(0, 3).join(", ");
  return `Generated the ${board} configuration${count ? ` with ${count} component${count === 1 ? "" : "s"}` : ""}${names ? `: ${names}` : ""}. Open Diagram, Pins, Code or Assembly to inspect it.`;
}

export default function AIChat({
  boardId,
  projectId,
  generation,
  initialPrompt,
  autoStart,
  onStage,
  onProgress,
  onSpec,
  onDone,
  retrySignal,
  onClose,
}: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "I generate the hardware configuration for this project — wiring, pins, firmware and assembly. Ask me to modify anything.",
      kind: "normal",
    },
  ]);
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const startedRef = useRef(false);
  const lastRequestRef = useRef<{ endpoint: string; body: Record<string, unknown> } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const generationRef = useRef(generation);
  const boardIdRef = useRef(boardId);  useEffect(() => {
    generationRef.current = generation;
  }, [generation]);

  useEffect(() => {
    boardIdRef.current = boardId;
  }, [boardId]);

  /**
   * Defensive catch for the streaming promise: streamGeneration already
   * routes every known failure (including 503s and cancellations) through
   * its callbacks, so this only fires for truly unexpected rejections.
   * An intentional cancellation (superseded request / user cancel) must
   * never surface as an error or an unhandled rejection.
   */
  const reportUnexpectedStreamError = useCallback(
    (messageId: string, controller: AbortController, err: unknown) => {
      if (controller.signal.aborted || isAbortError(err)) return;
      onStage("error");
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                content: err instanceof Error && err.message ? err.message : "Request failed",
                kind: "error",
              }
            : m
        )
      );
      setRunning(false);
    },
    [onStage]
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, running]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const runRequest = useCallback(
    (endpoint: string, body: Record<string, unknown>, userText: string | null) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      lastRequestRef.current = { endpoint, body };
      setRunning(true);
      onStage("contacting");

      let assistantId = "";
      if (userText !== null) {
        assistantId = `a_${Date.now()}`;
        const uid = `u_${Date.now()}`;
        setMessages((prev) => [
          ...prev,
          { id: uid, role: "user", content: userText, kind: "normal" },
          { id: assistantId, role: "assistant", content: "Working on it…", kind: "activity" },
        ]);
      } else {
        assistantId = `a_${Date.now()}`;
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: "assistant", content: "Generating hardware configuration…", kind: "activity" },
        ]);
      }

      const isFollowUp = endpoint.endsWith("/patch");
      let specArrived = false;

      void streamGeneration(endpoint, body, controller.signal, {
        onStage: (s) => {
          onStage(s);
          if (s === "building") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      content:
                        "Building views — diagram, pins and components are live, firmware finalizing…",
                    }
                  : m
              )
            );
          }
        },
        onProgress,
        onSpec: (gen) => {
          specArrived = true;
          onSpec(gen);
        },
        onDone: (gen) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: summaryFor(gen, isFollowUp || specArrived), kind: "normal" }
                : m
            )
          );
          setRunning(false);
          onDone(gen);
        },
        onError: (msg) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: msg, kind: "error" } : m
            )
          );
          setRunning(false);
        },
      }).catch((err: unknown) => {
        reportUnexpectedStreamError(assistantId, controller, err);
      });
    },
    [onStage, onProgress, onSpec, onDone, reportUnexpectedStreamError]
  );

  // Auto-start the initial generation exactly once.
  useEffect(() => {
    if (!autoStart || startedRef.current) return;
    // Child effects run before the parent's useSyncExternalStore hydration.
    // Confirm against localStorage so we never regenerate an existing project.
    if (typeof window !== "undefined" && projectId && getLocalProject(projectId)?.generation) {
      startedRef.current = true;
      return;
    }
    startedRef.current = true;
    const promptToRun =
      initialPrompt?.trim() || "ESP32 with a DHT22 sensor and a 128x64 OLED display";
    runRequest("/api/generate", { prompt: promptToRun, boardId: boardIdRef.current }, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, projectId]);

  // External retry (workspace error banner).
  const firstRetryRender = useRef(true);
  useEffect(() => {
    if (firstRetryRender.current) {
      firstRetryRender.current = false;
      return;
    }
    const last = lastRequestRef.current;
    if (last && !abortRef.current) return;
    if (last) runRequest(last.endpoint, last.body, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retrySignal]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleRetryMessage = useCallback(
    (id: string) => {
      const last = lastRequestRef.current;
      if (!last || running) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, content: "Retrying…", kind: "activity" as const } : m
        )
      );
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setRunning(true);
      onStage("contacting");
      let specArrived = false;
      const isFollowUp = last.endpoint.endsWith("/patch");
      void streamGeneration(last.endpoint, last.body, controller.signal, {
        onStage,
        onProgress,
        onSpec: (gen) => {
          specArrived = true;
          onSpec(gen);
        },
        onDone: (gen) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === id
                ? { ...m, content: summaryFor(gen, isFollowUp || specArrived), kind: "normal" as const }
                : m
            )
          );
          setRunning(false);
          onDone(gen);
        },
        onError: (msg) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === id ? { ...m, content: msg, kind: "error" as const } : m))
          );
          setRunning(false);
        },
      }).catch((err: unknown) => {
        reportUnexpectedStreamError(id, controller, err);
      });
    },
    [running, onStage, onProgress, onSpec, onDone, reportUnexpectedStreamError]
  );

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || running) return;
    setInput("");
    const current = generationRef.current;
    if (!current) {
      runRequest("/api/generate", { prompt: text, boardId: boardIdRef.current }, text);
    } else {
      runRequest(
        "/api/generate/patch",
        { currentGeneration: current, instruction: text },
        text
      );
    }
  }, [input, running, runRequest]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white min-h-0">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#e5e5e5] flex-shrink-0">
        <h2 className="text-sm font-semibold">AI Assistant</h2>
        <span className="flex items-center gap-1.5 text-[11px] text-[#999999]">
          <span
            className={`w-1.5 h-1.5 rounded-full ${running ? "bg-black pulse-dot" : "bg-[#d4d4d4]"}`}
          />
          {running ? "Working" : "Ready"}
        </span>
        <div className="flex-1" />
        <button
          onClick={onClose}
          aria-label="Close AI chat"
          className="w-7 h-7 rounded-md flex items-center justify-center text-[#666666] hover:text-[#111111] hover:bg-[#f3f3f3] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 min-h-0" role="log" aria-label="AI conversation">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div key={msg.id} className={`flex gap-2.5 mb-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
              <div
                className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center ${
                  isUser ? "bg-black" : "bg-[#f3f3f3] border border-[#e5e5e5]"
                }`}
                aria-hidden
              >
                {isUser ? (
                  <User className="w-3 h-3 text-white" />
                ) : (
                  <Bot className="w-3 h-3 text-[#111111]" />
                )}
              </div>
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2.5 text-xs leading-relaxed ${
                  isUser
                    ? "bg-[#f3f3f3] text-[#111111]"
                    : msg.kind === "error"
                      ? "bg-white border border-[#e5e5e5] border-l-4 border-l-[#dc2626] text-[#111111]"
                      : "bg-white border border-[#eeeeee] text-[#111111]"
                }`}
              >
                {msg.kind === "activity" ? (
                  <span className="flex items-center gap-2 text-[#666666]">
                    <span className="w-1.5 h-1.5 rounded-full bg-black pulse-dot flex-shrink-0" />
                    {msg.content}
                  </span>
                ) : msg.kind === "error" ? (
                  <div className="space-y-2">
                    <div className="flex items-start gap-1.5">
                      <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{msg.content}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRetryMessage(msg.id)}
                      disabled={running}
                      className="gap-1.5"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Try again
                    </Button>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-[#e5e5e5] p-3 flex-shrink-0">
        <div className="flex items-end gap-2 rounded-xl border border-[#e5e5e5] bg-white p-2 focus-within:border-[#999999] transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe a change…"
            aria-label="Ask the AI assistant for a change"
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-xs placeholder:text-[#999999] leading-relaxed px-1 py-1.5"
            style={{ minHeight: "20px", maxHeight: "120px" }}
          />
          {running ? (
            <Button size="sm" variant="outline" onClick={handleCancel} className="gap-1 flex-shrink-0" aria-label="Cancel generation">
              <X className="w-3.5 h-3.5" />
              Cancel
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!input.trim()}
              className="gap-1 flex-shrink-0"
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
