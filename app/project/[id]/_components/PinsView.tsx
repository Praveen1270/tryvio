"use client";

import React, { useState } from "react";
import { Cpu } from "lucide-react";

interface PinsViewProps {
  pinAssignments: Array<{ boardPin: string; connectedTo: string; purpose: string }>;
  boardName: string;
}

export default function PinsView({ pinAssignments, boardName }: PinsViewProps) {
  const [filter, setFilter] = useState("");

  const rows = pinAssignments.filter((p) => {
    if (!filter.trim()) return true;
    const q = filter.toLowerCase();
    return (
      p.boardPin.toLowerCase().includes(q) ||
      p.connectedTo.toLowerCase().includes(q) ||
      p.purpose.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-3 max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#111111]" />
          <span className="text-sm font-semibold">{boardName}</span>
        </div>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter pins…"
          className="h-8 w-48 rounded-lg border border-[#e5e5e5] bg-white px-3 text-xs outline-none placeholder:text-[#999999] focus:border-[#999999]"
        />
      </div>

      <div className="rounded-lg border border-[#e5e5e5] overflow-hidden bg-white">
        <div className="grid grid-cols-[120px_1fr_1fr] bg-[#f8f8f8] border-b border-[#e5e5e5] px-4 py-2">
          <span className="text-[11px] font-semibold text-[#111111]">Board Pin</span>
          <span className="text-[11px] font-semibold text-[#111111]">Connected Component</span>
          <span className="text-[11px] font-semibold text-[#111111]">Signal</span>
        </div>
        <div className="divide-y divide-[#eeeeee]">
          {rows.map((pin, i) => {
            const isGnd =
              pin.boardPin.toLowerCase().includes("gnd") ||
              pin.purpose.toLowerCase().includes("ground");
            const isPwr =
              pin.boardPin.toLowerCase().includes("3v") ||
              pin.boardPin.toLowerCase().includes("5v") ||
              pin.purpose.toLowerCase().includes("power");
            const dotColor = isGnd ? "#6b7280" : isPwr ? "#dc2626" : "#111111";

            return (
              <div
                key={`${pin.boardPin}-${i}`}
                className="grid grid-cols-[120px_1fr_1fr] px-4 py-2 hover:bg-[#f8f8f8] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: dotColor }}
                  />
                  <span className="text-xs font-mono font-semibold">{pin.boardPin}</span>
                </div>
                <span className="text-xs text-[#111111] truncate pr-2">{pin.connectedTo}</span>
                <span className="text-xs text-[#666666] truncate">{pin.purpose}</span>
              </div>
            );
          })}
          {rows.length === 0 && (
            <p className="px-4 py-6 text-xs text-[#999999] text-center">
              No pins match this filter.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {[
          { color: "#dc2626", label: "Power" },
          { color: "#6b7280", label: "Ground" },
          { color: "#111111", label: "Signal" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
            <span className="text-[11px] text-[#666666]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
