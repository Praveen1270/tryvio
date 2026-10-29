"use client";

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Thermometer, Monitor, Zap, Radio, Activity } from "lucide-react";
import { pinDotColor } from "@/lib/utils";
import type { ComponentCategory, PinType } from "@/lib/types";

interface ComponentNodeData {
  nodeId: string;
  label: string;
  category: ComponentCategory;
  pins: Array<{ name: string; type: PinType }>;
}

const CATEGORY_CONFIG: Record<
  ComponentCategory,
  { color: string; borderColor: string; icon: React.ElementType }
> = {
  sensor: {
    color: "#111111",
    borderColor: "#111111",
    icon: Thermometer,
  },
  display: {
    color: "#333333",
    borderColor: "#d4d4d4",
    icon: Monitor,
  },
  actuator: {
    color: "#333333",
    borderColor: "#d4d4d4",
    icon: Zap,
  },
  power: {
    color: "#333333",
    borderColor: "#d4d4d4",
    icon: Activity,
  },
  comms: {
    color: "#333333",
    borderColor: "#d4d4d4",
    icon: Radio,
  },
  mcu: {
    color: "#111111",
    borderColor: "#111111",
    icon: Radio,
  },
};

export default memo(function ComponentNode({ data }: NodeProps) {
  const d = data as unknown as ComponentNodeData;
  const config = CATEGORY_CONFIG[d.category] ?? CATEGORY_CONFIG.sensor;
  const Icon = config.icon;
  const nodeId = d.nodeId || "comp";

  return (
    <div
      className="rounded-xl overflow-hidden shadow-sm min-w-[180px] bg-white"
      style={{ border: `2px solid ${config.borderColor}` }}
    >
      {/* Header */}
      <div className="px-3 py-2 flex items-center gap-2 border-b border-[#e5e5e5] bg-[#f8f8f8]">
        <div className="w-5 h-5 rounded-md bg-black flex items-center justify-center">
          <Icon className="w-3 h-3 text-white" />
        </div>
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-wider text-[#666666]">
            {d.category}
          </p>
          <p className="text-[10px] font-bold text-[#111111] leading-tight truncate max-w-[130px]">{d.label}</p>
        </div>
      </div>

      {/* Pins */}
      <div className="px-2 py-2 space-y-0.5">
        {(d.pins ?? []).map((pin, i) => {
          const dotColor = pinDotColor(pin.type);
          return (
            <div key={`${pin.name}-${i}`} className="relative flex items-center gap-2 py-0.5">
              {/* Left handle (target) */}
              <Handle
                type="target"
                position={Position.Left}
                id={`${nodeId}-${pin.name}`}
                style={{
                  left: -6,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 8,
                  height: 8,
                  background: dotColor,
                  border: "2px solid #ffffff",
                  borderRadius: "50%",
                }}
              />
              {/* Left handle (source with identical id for bidirectional matching) */}
              <Handle
                type="source"
                position={Position.Left}
                id={`${nodeId}-${pin.name}`}
                style={{
                  left: -6,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 8,
                  height: 8,
                  background: dotColor,
                  border: "2px solid #ffffff",
                  borderRadius: "50%",
                  opacity: 0,
                  pointerEvents: "none",
                }}
              />
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: dotColor }}
              />
              <span className="text-[10px] font-mono font-bold text-[#111111]">{pin.name}</span>
              <span className="text-[9px] ml-auto capitalize text-[#999999]">
                {pin.type}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});
