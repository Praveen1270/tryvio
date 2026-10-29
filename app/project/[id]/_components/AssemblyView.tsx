"use client";

import React, { useState } from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";

interface AssemblyViewProps {
  steps: Array<{ step: number; title: string; description: string }>;
  warnings: string[];
  think?: string;
  unverifiedFlags?: string[];
  passives?: Array<{ instanceId: string; type: string; ohms?: number; label: string }>;
}

export default function AssemblyView({ steps, warnings, think, unverifiedFlags = [], passives = [] }: AssemblyViewProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const toggleStep = (stepNum: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepNum)) next.delete(stepNum);
      else next.add(stepNum);
      return next;
    });
  };

  const progress = steps.length > 0 ? (completedSteps.size / steps.length) * 100 : 0;

  return (
    <div className="space-y-4 max-w-3xl">
      {think && (
        <div className="rounded-lg bg-[#f8f8f8] border border-[#e5e5e5] p-4">
          <p className="text-[11px] font-semibold text-[#999999] uppercase tracking-wider mb-1">
            Design plan
          </p>
          <p className="text-sm text-[#111111] leading-relaxed">{think}</p>
        </div>
      )}

      <div className="rounded-lg bg-white border border-[#e5e5e5] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-[#999999] uppercase tracking-wider">
            Progress
          </span>
          <span className="text-xs font-mono text-[#666666]">
            {completedSteps.size}/{steps.length} steps
          </span>
        </div>
        <div className="h-1.5 bg-[#f3f3f3] rounded-full overflow-hidden">
          <div
            className="h-full bg-black rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {unverifiedFlags.length > 0 && (
        <div className="rounded-lg bg-white border border-[#e5e5e5] border-l-4 border-l-[#dc2626] p-4 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-[#dc2626] flex-shrink-0" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Unverified pinouts
            </span>
          </div>
          {unverifiedFlags.map((flag, i) => (
            <p key={i} className="text-xs text-[#666666] leading-relaxed pl-5">{flag}</p>
          ))}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="rounded-lg bg-[#f8f8f8] border border-[#e5e5e5] p-4 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Warnings</span>
          </div>
          {warnings.map((w, i) => (
            <p key={i} className="text-xs text-[#666666] leading-relaxed pl-5">{w}</p>
          ))}
        </div>
      )}

      {passives.length > 0 && (
        <div className="rounded-lg bg-white border border-[#e5e5e5] p-4">
          <p className="text-[11px] font-semibold text-[#999999] uppercase tracking-wider mb-2">
            Required passives
          </p>
          <div className="flex flex-wrap gap-1.5">
            {passives.map((p, idx) => (
              <span
                key={idx}
                className="text-xs bg-[#f8f8f8] border border-[#e5e5e5] px-2.5 py-1 rounded-md font-mono"
              >
                {p.label}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {steps.map((step) => {
          const done = completedSteps.has(step.step);
          return (
            <div
              key={step.step}
              className={`rounded-lg border bg-white p-4 flex items-start gap-4 transition-all ${
                done ? "border-[#e5e5e5] opacity-70" : "border-[#e5e5e5]"
              }`}
            >
              <span className="text-sm font-mono font-bold text-[#999999] w-7 flex-shrink-0 pt-0.5">
                {String(step.step).padStart(2, "0")}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${done ? "line-through text-[#999999]" : ""}`}>
                  {step.title}
                </p>
                <p className="text-sm text-[#666666] mt-1 leading-relaxed">{step.description}</p>
              </div>
              <button
                onClick={() => toggleStep(step.step)}
                aria-label={done ? "Mark step incomplete" : "Mark step complete"}
                className="flex-shrink-0 mt-0.5"
              >
                {done ? (
                  <CheckCircle2 className="w-5 h-5 text-black" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-[#d4d4d4] hover:border-black transition-colors" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
