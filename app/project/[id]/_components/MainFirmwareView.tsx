"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Copy, Download, Check, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

// Monaco is client-only and very heavy — dynamic import with no SSR
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="h-64 rounded-lg bg-[#f3f3f3] border border-[#e5e5e5] shimmer" />,
});

interface MainFirmwareViewProps {
  code: string;
  libraries: string[];
}

export default function MainFirmwareView({ code, libraries }: MainFirmwareViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "main.cpp";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3 max-w-5xl">
      {libraries.length > 0 && (
        <div className="rounded-lg bg-[#f8f8f8] border border-[#e5e5e5] p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold text-[#999999] uppercase tracking-wider">
              Required libraries
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {libraries.map((lib) => (
              <span
                key={lib}
                className="px-2 py-0.5 rounded-md bg-white border border-[#e5e5e5] text-[11px] font-mono"
              >
                {lib}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold">main.cpp</span>
          <span className="text-[11px] text-[#999999]">{code.split("\n").length} lines</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
            <Download className="w-3.5 h-3.5" />
            Download
          </Button>
        </div>
      </div>

      <div className="rounded-lg overflow-hidden border border-[#e5e5e5]">
        <MonacoEditor
          height="480px"
          language="cpp"
          value={code}
          theme="light"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 12,
            lineHeight: 20,
            fontFamily: "var(--font-geist-mono), 'Fira Code', monospace",
            scrollBeyondLastLine: false,
            renderLineHighlight: "none",
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            scrollbar: {
              verticalScrollbarSize: 6,
              horizontalScrollbarSize: 6,
            },
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>
    </div>
  );
}
