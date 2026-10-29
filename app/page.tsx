"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Cpu, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BOARDS } from "@/lib/knowledge/boards";
import { PRIMARY_MODEL } from "@/lib/ai/models";

const SUGGESTIONS = [
  { label: "ESP32 Smart Plant Monitor", prompt: "ESP32 plant monitor with soil moisture sensor, DHT22 and OLED display" },
  { label: "ESP32 Weather Station", prompt: "ESP32 weather station with BME280 sensor and OLED display" },
  { label: "Smart Door Lock", prompt: "ESP32 smart door lock with servo, RFID reader and status LEDs" },
  { label: "Smart Parking Sensor", prompt: "ESP32 parking sensor with ultrasonic distance sensor and buzzer" },
];

function shortModelName(id: string): string {
  const parts = id.split("/");
  const name = parts[parts.length - 1] ?? id;
  return name.replace(/:free$/, "").replace(/-/g, " ");
}

export default function HomePage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [selectedBoard, setSelectedBoard] = useState("esp32-c3-devkitm-1");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [prompt]);

  function handleCreate(promptText?: string) {
    const textToSubmit = (promptText || prompt).trim();
    if (!textToSubmit || creating) return;

    setCreating(true);
    // Unique ID per project — nothing is persisted until generation produces data.
    const newId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `proj_${Date.now()}`;
    router.push(
      `/project/${newId}?prompt=${encodeURIComponent(textToSubmit)}&board=${selectedBoard}`
    );
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCreate();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-[#111111] overflow-y-auto">
      {/* Minimal top bar */}
      <header className="flex items-center gap-2 px-4 md:px-6 py-3.5 border-b border-[#e5e5e5] flex-shrink-0">
        <div className="w-7 h-7 bg-black rounded-md flex items-center justify-center flex-shrink-0">
          <Cpu className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-bold tracking-tight">TRYVIO</span>
        <span className="badge-neutral">IDE</span>
      </header>

      {/* Centered home content */}
      <main className="flex-1 flex flex-col items-center px-4 py-10 md:py-16">
        <div className="w-full max-w-[760px] fade-in flex flex-col gap-6 md:pt-8">
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
              What do you want to build?
            </h1>
            <p className="text-sm text-[#666666]">
              Describe your hardware project to generate firmware, wiring and assembly instructions.
            </p>
          </div>

          <div className="rounded-2xl border border-[#e5e5e5] bg-white p-4 focus-within:border-[#999999] transition-all">
            <textarea
              ref={textareaRef}
              id="main-prompt-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your hardware project (e.g. ESP32 with DHT22 sensor and OLED display)..."
              rows={3}
              aria-label="Describe your hardware project"
              className="w-full bg-transparent resize-none outline-none text-sm placeholder:text-[#999999] leading-relaxed mb-3 min-h-[70px]"
              autoFocus
            />

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 border-t border-[#eeeeee]">
              <div className="flex items-center gap-2 flex-1 flex-wrap">
                <Select value={selectedBoard} onValueChange={setSelectedBoard}>
                  <SelectTrigger
                    id="homepage-board-selector"
                    aria-label="Select board"
                    className="h-8 text-xs px-2.5 flex-1 sm:flex-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-[#666666]" />
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
                <span
                  className="px-2.5 py-1 rounded-lg bg-[#f3f3f3] border border-[#e5e5e5] text-[11px] text-[#666666] font-medium capitalize"
                  title={PRIMARY_MODEL}
                >
                  {shortModelName(PRIMARY_MODEL)}
                </span>
              </div>

              <Button
                id="submit-prompt-btn"
                onClick={() => handleCreate()}
                disabled={!prompt.trim() || creating}
                loading={creating}
                className="h-9 px-5 gap-1.5 rounded-lg text-sm font-semibold w-full sm:w-auto"
              >
                <span>Generate</span>
                <ArrowUp className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-[#999999] uppercase tracking-wider text-center sm:text-left">
              Example projects
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCreate(item.prompt)}
                  className="text-left text-xs text-[#666666] hover:text-[#111111] bg-white hover:bg-[#f8f8f8] border border-[#e5e5e5] hover:border-[#d4d4d4] rounded-xl p-3 transition-all flex items-start gap-2.5"
                >
                  <Cpu className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.label}</p>
                    <p className="text-[11px] text-[#999999] truncate">{item.prompt}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
