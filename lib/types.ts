// Core types for Tryvio — AI IDE for embedded hardware

export type PinType = "power" | "ground" | "signal" | "data" | "clock";
export type SignalType = "power" | "ground" | "data" | "clock" | "gpio";
export type ComponentCategory =
  | "sensor"
  | "display"
  | "actuator"
  | "power"
  | "comms"
  | "mcu";

export interface BoardPin {
  id: string;
  label: string;
  capabilities: string[]; // ["gpio", "adc", "i2c_sda", "spi_mosi", "pwm", "3v3", "gnd", etc.]
}

export interface Board {
  id: string;
  name: string;
  mcu: string;
  pinoutJson: BoardPin[];
}

export interface ComponentPin {
  name: string;
  type: PinType;
}

export interface Component {
  id: string;
  name: string;
  category: ComponentCategory;
  defaultPinsJson: ComponentPin[];
  defaultLibrary: string;
  description?: string;
}

// Detailed Wire representation for the structured diagram renderer
export interface WireConnection {
  fromComponent: string;
  fromPin: string;
  toComponent: string;
  toPin: string;
  signalType: SignalType;
  color?: "red" | "gray" | "black" | "blue" | "green" | "magenta" | "purple" | "yellow" | "orange";
}

export interface PassiveComponent {
  instanceId: string;
  type: "resistor" | "capacitor" | "diode" | "pullup" | string;
  ohms?: number;
  label: string;
  between: Array<{ component: string; pin: string }>;
}

// The structured JSON contract returned by the LLM (Circuit Design Agent Output Contract)
export interface ProjectGeneration {
  think?: string; // Step 1 — Reasoning and plan
  board: { id: string; name: string; mcu: string };
  components: Array<{
    id: string;
    name: string;
    category: ComponentCategory;
    pins: Array<{ name: string; type: PinType }>;
    note?: string;
  }>;
  passives?: PassiveComponent[];
  wiring: WireConnection[];
  wires?: WireConnection[];
  pinAssignments: Array<{
    boardPin: string;
    connectedTo: string;
    purpose: string;
  }>;
  firmware: {
    filename: "main.cpp";
    language: "cpp";
    code: string;
    libraries: string[];
  };
  assembly: Array<{ step: number; title: string; description: string }>;
  warnings: string[];
  unverifiedFlags?: string[];
}

// Database row types
export interface Project {
  id: string;
  user_id: string;
  name: string;
  board_id: string;
  created_at: string;
  updated_at: string;
  autosaved_at?: string;
}

export interface ProjectVersion {
  id: string;
  project_id: string;
  generation_json: ProjectGeneration;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  project_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

// UI state types
export interface ProjectWithLatestVersion extends Project {
  latest_version?: ProjectVersion;
  chat_messages?: ChatMessage[];
}
