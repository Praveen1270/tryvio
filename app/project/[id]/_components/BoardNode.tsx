"use client";

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Cpu } from "lucide-react";

interface BoardNodeData {
  nodeId: string;
  label: string;
  mcu: string;
  pinAssignments: Array<{ boardPin: string; connectedTo: string; purpose: string }>;
  allPins?: Array<{ id: string; label: string }>;
}

export default memo(function BoardNode({ data }: NodeProps) {
  const d = data as unknown as BoardNodeData;
  const assignments = d.pinAssignments ?? [];
  const nodeId = d.nodeId || "board";

  // Build full list of pins to render
  const pinMap = new Map<string, string>();
  assignments.forEach((p) => {
    if (p.boardPin) pinMap.set(p.boardPin, p.connectedTo || p.purpose || "Connected");
  });

  if (d.allPins) {
    d.allPins.forEach((p) => {
      if (!pinMap.has(p.id)) {
        pinMap.set(p.id, p.label || p.id);
      }
    });
  }

  const pins = Array.from(pinMap.entries()).map(([pinId, conn]) => ({
    boardPin: pinId,
    connectedTo: conn,
  }));

  return (
    <div className="relative bg-white border-2 border-[#111111] rounded-xl overflow-hidden shadow-sm min-w-[220px]">
      {/* Header */}
      <div className="bg-[#f3f3f3] border-b border-[#e5e5e5] px-3 py-2 flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-black flex items-center justify-center">
          <Cpu className="w-3 h-3 text-white" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-[#111111] leading-none">{d.mcu}</p>
          <p className="text-[9px] text-[#666666] mt-0.5 leading-none truncate max-w-[160px]">{d.label}</p>
        </div>
      </div>

      {/* Pin rows */}
      <div className="px-2 py-2 space-y-0.5">
        {pins.map((pin, i) => (
          <div key={`${pin.boardPin}-${i}`} className="relative flex items-center gap-2 py-0.5">
            <span className="text-[9px] font-mono font-bold text-[#111111] w-16 flex-shrink-0">{pin.boardPin}</span>
            <span className="text-[9px] text-[#666666] truncate flex-1">{pin.connectedTo}</span>

            {/* Source handle with exact pin id */}
            <Handle
              type="source"
              position={Position.Right}
              id={`${nodeId}-${pin.boardPin}`}
              style={{
                right: -6,
                top: "50%",
                transform: "translateY(-50%)",
                width: 8,
                height: 8,
                background: "#111111",
                border: "2px solid #ffffff",
                borderRadius: "50%",
              }}
            />
            {/* Target handle with exact same pin id for bidirectional edge matching */}
            <Handle
              type="target"
              position={Position.Right}
              id={`${nodeId}-${pin.boardPin}`}
              style={{
                right: -6,
                top: "50%",
                transform: "translateY(-50%)",
                width: 8,
                height: 8,
                background: "#111111",
                border: "2px solid #ffffff",
                borderRadius: "50%",
                opacity: 0,
                pointerEvents: "none",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
});
