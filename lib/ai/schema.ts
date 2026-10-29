import { z } from "zod";
import type { PinType, SignalType, ComponentCategory } from "@/lib/types";

export const PinTypeSchema = z.string().transform((val): PinType => {
  const lower = val.toLowerCase();
  if (lower.includes("pwr") || lower.includes("power") || lower.includes("vcc") || lower.includes("3v") || lower.includes("5v")) return "power";
  if (lower.includes("gnd") || lower.includes("ground")) return "ground";
  if (lower.includes("data") || lower.includes("sda") || lower.includes("mosi") || lower.includes("miso")) return "data";
  if (lower.includes("clk") || lower.includes("clock") || lower.includes("scl") || lower.includes("sck")) return "clock";
  return "signal";
});

export const SignalTypeSchema = z.string().transform((val): SignalType => {
  const lower = val.toLowerCase();
  if (lower.includes("pwr") || lower.includes("power") || lower.includes("vcc")) return "power";
  if (lower.includes("gnd") || lower.includes("ground")) return "ground";
  if (lower.includes("data") || lower.includes("sda")) return "data";
  if (lower.includes("clk") || lower.includes("clock") || lower.includes("scl")) return "clock";
  return "gpio";
});

export const ComponentCategorySchema = z.string().transform((val): ComponentCategory => {
  const lower = val.toLowerCase();
  if (lower.includes("display") || lower.includes("screen") || lower.includes("oled") || lower.includes("tft") || lower.includes("lcd")) return "display";
  if (lower.includes("actuator") || lower.includes("motor") || lower.includes("servo") || lower.includes("relay") || lower.includes("led")) return "actuator";
  if (lower.includes("power")) return "power";
  if (lower.includes("comm") || lower.includes("wifi") || lower.includes("bluetooth") || lower.includes("lora")) return "comms";
  if (lower.includes("mcu") || lower.includes("board")) return "mcu";
  return "sensor";
});

export const WireColorSchema = z.enum(["red", "gray", "black", "blue", "green", "magenta", "purple", "yellow", "orange"]).optional();

export const PassiveComponentSchema = z.object({
  instanceId: z.string(),
  type: z.string(),
  ohms: z.number().optional(),
  label: z.string(),
  between: z.array(z.object({ component: z.string(), pin: z.string() })).default([]),
});

export const ProjectGenerationSchema = z.object({
  think: z.string().optional(),
  board: z.object({
    id: z.string().default("esp32-c3-devkitm-1"),
    name: z.string().default("Espressif ESP32-C3-DevKitM-1"),
    mcu: z.string().default("ESP32-C3"),
  }),
  components: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      category: ComponentCategorySchema,
      pins: z.array(
        z.object({
          name: z.string(),
          type: PinTypeSchema,
        })
      ),
      note: z.string().optional(),
    })
  ).default([]),
  passives: z.array(PassiveComponentSchema).default([]),
  wiring: z.array(
    z.object({
      fromComponent: z.string(),
      fromPin: z.string(),
      toComponent: z.string(),
      toPin: z.string(),
      signalType: SignalTypeSchema,
      color: WireColorSchema,
    })
  ).default([]),
  wires: z.array(
    z.object({
      fromComponent: z.string().optional(),
      fromPin: z.string().optional(),
      toComponent: z.string().optional(),
      toPin: z.string().optional(),
      from: z.object({ component: z.string(), pin: z.string() }).optional(),
      to: z.object({ component: z.string(), pin: z.string() }).optional(),
      signalType: SignalTypeSchema.optional(),
      signal: z.string().optional(),
      color: WireColorSchema,
    })
  ).optional(),
  pinAssignments: z.array(
    z.object({
      boardPin: z.string(),
      connectedTo: z.string(),
      purpose: z.string(),
    })
  ).default([]),
  firmware: z.object({
    filename: z.string().default("main.cpp"),
    language: z.string().default("cpp"),
    code: z.string().default("// main.cpp\n#include <Arduino.h>\n\nvoid setup() {\n}\n\nvoid loop() {\n}\n"),
    libraries: z.array(z.string()).default([]),
  }),
  assembly: z.array(
    z.object({
      step: z.coerce.number().default(1),
      title: z.string().default("Assembly step"),
      description: z.string().default("Connect components as shown in the diagram."),
    })
  ).default([]),
  warnings: z.array(z.string()).default([]),
  unverifiedFlags: z.array(z.string()).default([]),
});

export type ProjectGeneration = z.infer<typeof ProjectGenerationSchema>;

/** Resilient JSON extraction and schema parsing */
export function parseGenerationResponse(raw: string): {
  success: true;
  data: ProjectGeneration;
} | { success: false; error: string } {
  try {
    // Locate the outermost JSON object substring
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      return { success: false, error: "No valid JSON object structure found in LLM response." };
    }

    let jsonSubstring = raw.slice(firstBrace, lastBrace + 1).trim();

    // Remove any trailing commas before closing braces/brackets if present
    jsonSubstring = jsonSubstring
      .replace(/,\s*}/g, "}")
      .replace(/,\s*\]/g, "]");

    const parsed = JSON.parse(jsonSubstring);
    const result = ProjectGenerationSchema.safeParse(parsed);

    if (result.success) {
      // Ensure required structure defaults
      const data = result.data as ProjectGeneration;
      if (!data.firmware || !data.firmware.code) {
        data.firmware = {
          filename: "main.cpp",
          language: "cpp",
          code: "// main.cpp\n#include <Arduino.h>\n\nvoid setup() {\n  Serial.begin(115200);\n}\n\nvoid loop() {\n}\n",
          libraries: [],
        };
      }
      return { success: true, data };
    }

    return {
      success: false,
      error: result.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "JSON parse failed",
    };
  }
}
