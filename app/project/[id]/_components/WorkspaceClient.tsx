"use client";

import React, { useState, useCallback, useRef, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Cpu,
  Plus,
  LayoutGrid,
  Code2,
  Pin,
  Package,
  ListOrdered,
  Download,
  Globe,
  Menu,
  MessageSquare,
  PanelRightOpen,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BOARDS } from "@/lib/knowledge/boards";
import type { ProjectGeneration } from "@/lib/types";
import {
  getLocalProject,
  saveLocalProject,
  subscribeLocalProjects,
  getLocalProjectsSnapshot,
  getLocalProjectsServerSnapshot,
} from "@/lib/store/localProjects";
import type { GenStage } from "@/lib/ai/streamClient";
import CanvasPanel from "./CanvasPanel";
import MainFirmwareView from "./MainFirmwareView";
import PinsView from "./PinsView";
import ComponentsView from "./ComponentsView";
import AssemblyView from "./AssemblyView";
import AIChat from "./AIChat";

type ProjectView = "diagram" | "code" | "pins" | "components" | "assembly";

const VIEWS: Array<{ id: ProjectView; label: string; icon: React.ElementType }> = [
  { id: "diagram", label: "Diagram", icon: LayoutGrid },
  { id: "code", label: "Code", icon: Code2 },
  { id: "pins", label: "Pins", icon: Pin },
  { id: "components", label: "Components", icon: Package },
  { id: "assembly", label: "Assembly", icon: ListOrdered },
];

const VIEW_META: Record<ProjectView, { title: string; subtitle: string }> = {
  diagram: { title: "Diagram", subtitle: "Hardware wiring and connections" },
  code: { title: "Firmware", subtitle: "main.cpp" },
  pins: { title: "Pin Mapping", subtitle: "Board GPIO assignments" },
  components: { title: "Components", subtitle: "Hardware used in this project" },
  assembly: { title: "Assembly", subtitle: "Step-by-step hardware instructions" },
};

interface WorkspaceClientProps {
  projectId: string;
}

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default function WorkspaceClient({ projectId }: WorkspaceClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt") || undefined;
  const initialBoard = searchParams.get("board") || "esp32-c3-devkitm-1";

  const [activeView, setActiveView] = useState<ProjectView>("diagram");
  const [editingName, setEditingName] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");

  // External store — projects list + this project (no setState-in-effect).
  const projects = useSyncExternalStore(
    subscribeLocalProjects,
    getLocalProjectsSnapshot,
    getLocalProjectsServerSnapshot
  );
  const stored = projects.find((p) => p.id === projectId) ?? null;

  // Local drafts override the store while editing / streaming, then persist.
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [boardDraft, setBoardDraft] = useState<string | null>(null);
  const [genDraft, setGenDraft] = useState<ProjectGeneration | null>(null);

  const projectName = nameDraft ?? stored?.name ?? "New Hardware Project";
  const boardId = boardDraft ?? stored?.board_id ?? initialBoard;
  const generation = genDraft ?? stored?.generation ?? null;

  // Generation progress mirrored from AIChat (single source of runs).
  const [genStage, setGenStage] = useState<GenStage>("idle");
  const [genChars, setGenChars] = useState(0);
  const [genElapsed, setGenElapsed] = useState(0);
  const [retrySignal, setRetrySignal] = useState(0);

  // Panels: desktop chat collapse + mobile drawer/overlay.
  const [chatOpen, setChatOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  const userSwitchedViewRef = useRef(false);
  // Auto-start only when there is no stored generation yet.
  const autoStart = !generation;

  const generating =
    genStage === "contacting" || genStage === "receiving" || genStage === "building";

  // ---- Escape closes mobile drawer / chat overlay ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        setMobileChatOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const persist = useCallback(
    (gen: ProjectGeneration | null, name: string, board: string) => {
      if (!projectId) return;
      // Never persist empty placeholder projects: only save once real
      // generation data exists, or when updating an already-stored project.
      if (!gen && !getLocalProject(projectId)) return;
      setSaveState("saving");
      try {
        saveLocalProject({ id: projectId, name, board_id: board, generation: gen });
      } finally {
        setSaveState("saved");
      }
    },
    [projectId]
  );

  const handleSpec = useCallback(
    (gen: ProjectGeneration) => {
      setGenDraft(gen);
      persist(gen, projectName, boardId);
      if (!userSwitchedViewRef.current) setActiveView("diagram");
    },
    [persist, projectName, boardId]
  );

  const handleDone = useCallback(
    (gen: ProjectGeneration) => {
      setGenDraft(gen);
      persist(gen, projectName, boardId);
    },
    [persist, projectName, boardId]
  );

  const handleNameSave = useCallback(() => {
    setEditingName(false);
    persist(generation, projectName, boardId);
  }, [generation, projectName, boardId, persist]);

  const handleBoardChange = useCallback(
    (next: string) => {
      setBoardDraft(next);
      persist(generation, projectName, next);
    },
    [generation, projectName, persist]
  );

  const handleDeploy = useCallback(() => {
    if (!generation) return;
    const blob = new Blob([generation.firmware.code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = generation.firmware.filename || "main.cpp";
    a.click();
    URL.revokeObjectURL(url);
  }, [generation]);

  const handlePublish = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // clipboard unavailable — no-op
    }
  }, []);

  const switchView = useCallback((v: ProjectView) => {
    userSwitchedViewRef.current = true;
    setActiveView(v);
    setDrawerOpen(false);
  }, []);

  const meta = VIEW_META[activeView];

  const sidebarBody = (
    <>
      <div className="px-3 pt-3 pb-2">
        <Button size="sm" className="w-full justify-start gap-2" onClick={() => router.push("/")}>
          <Plus className="w-3.5 h-3.5" />
          New Project
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 min-h-0">
        <p className="px-2 pt-2 pb-1.5 text-[10px] font-semibold text-[#999999] uppercase tracking-wider">
          Projects
        </p>
        {projects.length === 0 ? (
          <p className="px-2 py-2 text-[11px] text-[#999999]">No saved projects yet</p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/project/${p.id}`}
                onClick={() => setDrawerOpen(false)}
                className={`px-2.5 py-2 rounded-md text-xs truncate transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black ${
                  p.id === projectId
                    ? "bg-[#f1f1f1] text-[#111111] font-semibold"
                    : "text-[#666666] hover:text-[#111111] hover:bg-[#f5f5f5]"
                }`}
              >
                {p.name}
              </Link>
            ))}
          </div>
        )}
        <p className="px-2 pt-4 pb-1.5 text-[10px] font-semibold text-[#999999] uppercase tracking-wider">
          Project
        </p>
        <nav aria-label="Project views" className="flex flex-col gap-0.5 pb-3">
          {VIEWS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => switchView(id)}
              aria-current={activeView === id ? "page" : undefined}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black ${
                activeView === id
                  ? "bg-[#f1f1f1] text-[#111111] font-semibold"
                  : "text-[#666666] hover:text-[#111111] hover:bg-[#f5f5f5]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" aria-hidden />
              {label}
            </button>
          ))}
        </nav>
      </div>
    </>
  );

  const chatPanel = (
    <AIChat
      boardId={boardId}
      projectId={projectId}
      generation={generation}
      initialPrompt={initialPrompt}
      autoStart={autoStart}
      onStage={(s) => {
        setGenStage(s);
      }}
      onProgress={(chars, elapsed) => {
        setGenChars(chars);
        setGenElapsed(elapsed);
      }}
      onSpec={handleSpec}
      onDone={handleDone}
      retrySignal={retrySignal}
      onClose={() => {
        setChatOpen(false);
        setMobileChatOpen(false);
      }}
    />
  );

  return (
    <TooltipProvider delayDuration={500}>
      <div className="flex flex-col h-full bg-white text-[#111111] overflow-hidden">
        {/* ===== TOP HEADER (global info only — no project navigation) ===== */}
        <header className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 border-b border-[#e5e5e5] bg-white flex-shrink-0">
          <button
            className="md:hidden w-8 h-8 rounded-md flex items-center justify-center text-[#666666] hover:text-[#111111] hover:bg-[#f3f3f3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open project menu"
          >
            <Menu className="w-4 h-4" />
          </button>
          <Link href="/" className="flex items-center gap-2 flex-shrink-0" aria-label="Tryvio home">
            <div className="w-6 h-6 bg-black rounded-md flex items-center justify-center">
              <Cpu className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight hidden sm:inline">TRYVIO</span>
            <span className="badge-neutral hidden sm:inline">IDE</span>
          </Link>
          <Separator orientation="vertical" className="h-5 hidden sm:block" />
          {editingName ? (
            <input
              autoFocus
              className="bg-transparent border-none outline-none text-sm font-semibold w-[140px] md:w-[220px] placeholder:text-[#999999]"
              value={projectName}
              aria-label="Project name"
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="text-sm font-semibold hover:text-[#666666] transition-colors truncate max-w-[120px] sm:max-w-[200px] md:max-w-[280px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded"
              title="Rename project"
            >
              {projectName}
            </button>
          )}
          <div className="flex-1" />
          <div className="hidden md:flex items-center gap-2">
            <Select value={boardId} onValueChange={handleBoardChange}>
              <SelectTrigger id="board-selector" className="w-52" aria-label="Select board">
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-3 h-3 text-[#666666]" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {BOARDS.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-[#999999] w-16 text-right flex-shrink-0">
              {saveState === "saving" ? "Saving…" : "Saved"}
            </span>
            <Button
              size="sm"
              disabled={!generation}
              onClick={handleDeploy}
              className="gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Deploy
            </Button>
            <Button size="sm" onClick={handlePublish} className="gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              Publish
            </Button>
            {!chatOpen && (
              <button
                onClick={() => setChatOpen(true)}
                aria-label="Open AI chat"
                title="Open AI chat"
                className="w-8 h-8 rounded-md flex items-center justify-center text-[#666666] hover:text-[#111111] hover:bg-[#f3f3f3] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
              >
                <PanelRightOpen className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            className="md:hidden w-8 h-8 rounded-md flex items-center justify-center text-[#666666] hover:text-[#111111] hover:bg-[#f3f3f3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
            onClick={() => setMobileChatOpen(true)}
            aria-label="Open AI assistant"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </header>

        <div className="flex flex-1 overflow-hidden relative">
          {/* ===== LEFT SIDEBAR (desktop) ===== */}
          <aside className="hidden md:flex w-[220px] flex-shrink-0 flex-col border-r border-[#e5e5e5] bg-white">
            {sidebarBody}
          </aside>

          {/* ===== MOBILE DRAWER ===== */}
          {drawerOpen && (
            <div className="md:hidden absolute inset-0 z-50">
              <button
                aria-label="Close project menu"
                className="absolute inset-0 bg-black/30"
                onClick={() => setDrawerOpen(false)}
              />
              <aside
                role="dialog"
                aria-label="Project menu"
                className="absolute inset-y-0 left-0 w-[260px] bg-white border-r border-[#e5e5e5] flex flex-col fade-in"
              >
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[#e5e5e5]">
                  <span className="text-sm font-bold">Project</span>
                  <div className="flex-1" />
                  <button
                    onClick={() => setDrawerOpen(false)}
                    aria-label="Close project menu"
                    className="text-xs text-[#666666] hover:text-[#111111] px-2 py-1"
                  >
                    Close
                  </button>
                </div>
                {sidebarBody}
                <div className="border-t border-[#e5e5e5] p-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => {
                      setDrawerOpen(false);
                      setMobileChatOpen(true);
                    }}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    AI Assistant
                  </Button>
                </div>
              </aside>
            </div>
          )}

          {/* ===== CENTRAL WORKSPACE ===== */}
          <main className="flex-1 flex flex-col overflow-hidden bg-white min-w-0">
            <div className="px-4 md:px-5 pt-3 md:pt-4 pb-2 flex-shrink-0">
              <h2 className="text-base md:text-lg font-semibold tracking-tight">{meta.title}</h2>
              <p className="text-xs text-[#666666]">{meta.subtitle}</p>
            </div>

            {genStage === "error" && !generation && (
              <GenerationErrorBanner onRetry={() => setRetrySignal((c) => c + 1)} />
            )}
            {genStage === "cancelled" && !generation && (
              <div className="mx-4 md:mx-5 mb-2 rounded-lg border border-[#e5e5e5] bg-[#f8f8f8] px-4 py-3 flex items-center gap-3 flex-shrink-0">
                <p className="text-xs text-[#666666] flex-1">Generation cancelled.</p>
                <Button size="sm" onClick={() => setRetrySignal((c) => c + 1)} className="gap-1.5">
                  <RotateCcw className="w-3 h-3" />
                  Try again
                </Button>
              </div>
            )}

            <div className="flex-1 overflow-hidden px-4 md:px-5 pb-3 min-h-0">
              {!generation ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
                  {generating ? (
                    <>
                      <div className="flex items-center gap-1.5" aria-hidden>
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-2 h-2 rounded-full bg-black"
                            style={{ animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite` }}
                          />
                        ))}
                      </div>
                      <p className="text-sm font-medium">Creating your hardware project…</p>
                      <p className="text-xs text-[#666666] max-w-sm">
                        {genStage === "contacting" && "Contacting the model."}
                        {genStage === "receiving" &&
                          `Receiving response… (${(genChars / 1024).toFixed(1)} KB, ${formatElapsed(genElapsed)})`}
                        {genStage === "building" && "Finalizing hardware specification…"}
                      </p>
                      <p className="text-[11px] text-[#999999]">
                        The workspace stays responsive — open the AI chat to follow progress.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium">No project data yet</p>
                      <p className="text-xs text-[#666666] max-w-sm">
                        The AI assistant will generate firmware, wiring and assembly instructions.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="h-full overflow-y-auto">
                  {activeView === "diagram" && (
                    <div className="h-full min-h-[420px] rounded-lg border border-[#e5e5e5] overflow-hidden">
                      <CanvasPanel generation={generation} mode="diagram" />
                    </div>
                  )}
                  {activeView === "code" && (
                    <MainFirmwareView
                      code={generation.firmware.code}
                      libraries={generation.firmware.libraries}
                    />
                  )}
                  {activeView === "pins" && (
                    <PinsView
                      pinAssignments={generation.pinAssignments}
                      boardName={generation.board.name}
                    />
                  )}
                  {activeView === "components" && (
                    <ComponentsView components={generation.components} />
                  )}
                  {activeView === "assembly" && (
                    <AssemblyView
                      steps={generation.assembly}
                      warnings={generation.warnings}
                      think={generation.think}
                      unverifiedFlags={generation.unverifiedFlags}
                      passives={generation.passives}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Mobile AI entry */}
            <div className="md:hidden border-t border-[#e5e5e5] px-4 py-2.5 flex-shrink-0 bg-white">
              <button
                onClick={() => setMobileChatOpen(true)}
                className="w-full flex items-center gap-2 rounded-lg border border-[#e5e5e5] px-3 py-2.5 text-sm text-[#999999]"
              >
                <MessageSquare className="w-4 h-4" />
                Ask AI about this project…
              </button>
            </div>
          </main>

          {/* ===== AI CHAT (desktop right panel) ===== */}
          <aside
            className={`${chatOpen ? "hidden md:flex" : "hidden"} w-[320px] flex-shrink-0 flex-col border-l border-[#e5e5e5] bg-white min-h-0`}
            aria-label="AI assistant panel"
          >
            {chatPanel}
          </aside>

          {/* ===== AI CHAT (mobile full-screen overlay) ===== */}
          {mobileChatOpen && (
            <div className="md:hidden absolute inset-0 z-50 bg-white flex flex-col" role="dialog" aria-label="AI assistant">
              {chatPanel}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

function GenerationErrorBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-4 md:mx-5 mb-2 rounded-lg border border-[#e5e5e5] bg-[#f8f8f8] px-4 py-3 flex items-center gap-3 fade-in flex-shrink-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">Generation failed</p>
        <p className="text-xs text-[#666666] truncate">
          We couldn&apos;t generate the hardware project. Details are in the AI chat.
        </p>
      </div>
      <Button size="sm" onClick={onRetry} className="gap-1.5 flex-shrink-0">
        <RotateCcw className="w-3 h-3" />
        Try again
      </Button>
    </div>
  );
}
