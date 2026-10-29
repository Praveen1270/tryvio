"use client";

import React from "react";
import { Thermometer, Monitor, Zap, Radio, Activity, Package } from "lucide-react";
import { pinDotColor } from "@/lib/utils";
import type { ComponentCategory } from "@/lib/types";

interface ComponentsViewProps {
  components: Array<{
    id: string;
    name: string;
    category: ComponentCategory;
    pins: Array<{ name: string; type: string }>;
    note?: string;
  }>;
}

const CATEGORY_ICONS: Record<ComponentCategory, React.ElementType> = {
  sensor: Thermometer,
  display: Monitor,
  actuator: Zap,
  power: Activity,
  comms: Radio,
  mcu: Package,
};

export default function ComponentsView({ components }: ComponentsViewProps) {
  if (components.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-[#999999]">No components detected</div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl">
      {components.map((comp) => {
        const Icon = CATEGORY_ICONS[comp.category] ?? Package;

        return (
          <div key={comp.id} className="rounded-lg border border-[#e5e5e5] bg-white overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#eeeeee]">
              <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{comp.name}</p>
                <p className="text-[11px] font-medium uppercase tracking-wider text-[#999999]">
                  {comp.category}
                </p>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#e5e5e5] bg-[#f8f8f8] text-[#666666] flex-shrink-0">
                {comp.id}
              </span>
            </div>

            {comp.note && (
              <p className="px-4 pt-2.5 text-xs text-[#666666] leading-relaxed">{comp.note}</p>
            )}

            <div className="px-4 py-3">
              <p className="text-[11px] font-semibold text-[#999999] uppercase tracking-wider mb-2">
                Used pins ({comp.pins.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {comp.pins.map((pin, i) => {
                  const dotColor = pinDotColor(pin.type);
                  return (
                    <div
                      key={`${pin.name}-${i}`}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#f8f8f8] border border-[#e5e5e5]"
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: dotColor }}
                      />
                      <span className="text-[11px] font-mono font-medium">{pin.name}</span>
                      <span className="text-[10px] text-[#999999] capitalize">{pin.type}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
