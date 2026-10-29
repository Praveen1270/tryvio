"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  BackgroundVariant,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { ProjectGeneration } from "@/lib/types";
import { wireColor } from "@/lib/utils";
import { BOARD_MAP } from "@/lib/knowledge/boards";
import ComponentNode from "./ComponentNode";
import BoardNode from "./BoardNode";

const nodeTypes = { component: ComponentNode, board: BoardNode };

function buildNodesAndEdges(generation: ProjectGeneration): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const boardNodeId = generation.board?.id || "board";
  const boardSpec = BOARD_MAP[boardNodeId] || BOARD_MAP["esp32-devkitc"] || BOARD_MAP["esp32-c3-devkitm-1"];

  // Board node (center-left)
  nodes.push({
    id: boardNodeId,
    type: "board",
    position: { x: 60, y: 80 },
    data: {
      nodeId: boardNodeId,
      label: generation.board?.name || boardSpec?.name || "Target Board",
      mcu: generation.board?.mcu || boardSpec?.mcu || "MCU",
      pinAssignments: generation.pinAssignments || [],
      allPins: boardSpec?.pinoutJson || [],
    },
  });

  // Component nodes (distributed on the right)
  const componentsList = generation.components || [];
  const componentCount = componentsList.length;
  componentsList.forEach((comp: GenerationComponent, idx: number) => {
    const ySpacing = Math.max(160, 520 / Math.max(componentCount, 1));
    const yOffset = idx * ySpacing + 40;
    nodes.push({
      id: comp.id,
      type: "component",
      position: { x: 560, y: yOffset },
      data: {
        nodeId: comp.id,
        label: comp.name,
        category: comp.category,
        pins: comp.pins,
      },
    });
  });

  // Helper to resolve node ID
  const resolveNodeId = (id: string) => {
    if (!id || id.toLowerCase() === "board" || id === generation.board?.id) {
      return boardNodeId;
    }
    return id;
  };

  // Helper to normalize pin name matching across board and components
  const normalizePin = (pin: string) => {
    if (!pin) return "";
    const p = pin.trim();
    if (/^(vcc|3\.3v|3v3|5v|power)$/i.test(p)) return p.toUpperCase();
    if (/^(gnd|ground)$/i.test(p)) return "GND";
    return p;
  };

  // Edges from wiring
  (generation.wiring || []).forEach((wire: GenerationWire, idx: number) => {
    const sourceNode = resolveNodeId(wire.fromComponent);
    const targetNode = resolveNodeId(wire.toComponent);
    const strokeColor = wireColor(wire.color || wire.signalType);
    const fromPinNormalized = normalizePin(wire.fromPin);
    const toPinNormalized = normalizePin(wire.toPin);

    edges.push({
      id: `e-${idx}-${wire.fromComponent}-${wire.fromPin}-${wire.toComponent}-${wire.toPin}`,
      source: sourceNode,
      target: targetNode,
      sourceHandle: `${sourceNode}-${fromPinNormalized}`,
      targetHandle: `${targetNode}-${toPinNormalized}`,
      type: "smoothstep",
      animated: wire.signalType === "data" || wire.signalType === "clock",
      style: {
        stroke: strokeColor,
        strokeWidth: 2,
        opacity: 0.85,
      },
      label: `${wire.fromPin} → ${wire.toPin}`,
      labelStyle: {
        fill: strokeColor,
        fontSize: 9,
        fontFamily: "var(--font-geist-mono)",
        fontWeight: 600,
      },
      labelBgStyle: {
        fill: "#ffffff",
        fillOpacity: 0.9,
        rx: 3,
        ry: 3,
      },
    });
  });

  return { nodes, edges };
}

function EmptyCanvas() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none bg-white">
      <div className="w-16 h-16 rounded-2xl bg-[#f8f8f8] border border-[#e5e5e5] flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect x="4" y="8" width="10" height="16" rx="2" stroke="#d4d4d4" strokeWidth="1.5" />
          <rect x="18" y="4" width="10" height="10" rx="2" stroke="#111111" strokeWidth="1.5" />
          <rect x="18" y="18" width="10" height="10" rx="2" stroke="#666666" strokeWidth="1.5" />
          <line x1="14" y1="13" x2="18" y2="9" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="2 2" />
          <line x1="14" y1="19" x2="18" y2="23" stroke="#9333ea" strokeWidth="1.5" strokeDasharray="2 2" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-[#666666] mb-1">No diagram yet</p>
        <p className="text-xs text-[#999999]">Describe your project below to generate a wiring diagram</p>
      </div>
    </div>
  );
}

interface GenerationComponent {
  id: string;
  name: string;
  category?: string;
  pins?: unknown[];
}

interface GenerationWire {
  fromComponent: string;
  fromPin: string;
  toComponent: string;
  toPin: string;
  signalType: string;
  color?: string;
}

interface CanvasPanelProps {
  generation: ProjectGeneration | null;
  mode?: "diagram" | "breadboard";
}

export default function CanvasPanel({ generation }: CanvasPanelProps) {
  const initialData = useMemo(
    () => (generation ? buildNodesAndEdges(generation) : { nodes: [], edges: [] }),
    [generation]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData.edges);

  useEffect(() => {
    if (generation) {
      const { nodes: newNodes, edges: newEdges } = buildNodesAndEdges(generation);
      setNodes(newNodes);
      setEdges(newEdges);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [generation, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="w-full h-full relative canvas-grid">
      {!generation ? (
        <EmptyCanvas />
      ) : (
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        style={{ background: "transparent" }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#e0e0e0"
        />
        <Controls
          className="!bg-white !border-[#e5e5e5] !rounded-lg overflow-hidden"
          showInteractive={false}
        />

        {/* Wire legend */}
        {generation && (
          <Panel position="bottom-right">
            <div className="bg-white/90 backdrop-blur-sm border border-[#e5e5e5] rounded-lg p-2.5 text-[10px] space-y-1 mb-10 mr-2">
              {[
                { color: "#ef4444", label: "Power" },
                { color: "#6b7280", label: "Ground" },
                { color: "#3b82f6", label: "Data" },
                { color: "#a855f7", label: "Clock" },
                { color: "#10b981", label: "GPIO" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-5 h-0.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[#666666]">{label}</span>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {/* Deploy button */}
        <Panel position="bottom-left">
          <button
            id="deploy-btn"
            className="flex items-center gap-2 bg-black border border-black hover:bg-[#222222] rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-all mb-2 ml-1"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1L10 5H7.5V11H4.5V5H2L6 1Z" fill="#fff" />
            </svg>
            Deploy
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2.5 4L5 6.5L7.5 4" stroke="#999" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
        </Panel>
      </ReactFlow>
      )}
    </div>
  );
}
