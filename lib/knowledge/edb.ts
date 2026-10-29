export interface EdbPin {
  name: string;
  type: "power_in" | "power_out" | "ground" | "digital" | "analog" | "i2c" | "spi" | "uart" | "adc" | "pwm" | "single-wire";
  capabilities?: string[];
  role?: string;
  default?: boolean;
  notes?: string;
  inputOnly?: boolean;
  requiresPullup?: {
    toPin: string;
    ohms: [number, number];
    note: string;
  };
}

export interface EdbPowerPin {
  name: string;
  type: "power_out" | "power_in" | "ground";
  voltage?: number;
  maxCurrentMa?: number;
  note?: string;
}

export interface EdbConflict {
  pins: string[];
  reason: string;
}

export interface EdbRecord {
  id: string;
  displayName: string;
  category: "board" | "sensor" | "display" | "actuator" | "passive" | "power" | "comms";
  manufacturer?: string;
  voltage: {
    logic: number | [number, number];
    input?: [number, number];
    regulatedOnBoard?: boolean;
  };
  communication?: string[];
  power?: {
    pins: EdbPowerPin[];
  };
  pins: EdbPin[];
  conflicts?: EdbConflict[];
  timing?: {
    minSamplePeriodMs?: number;
  };
  libraries?: string[];
  renderHints?: {
    icon?: string;
    swappableWith?: string[];
  };
  verified: boolean;
  source?: string;
  schemaVersion: string;
}

export const EDB: Record<string, EdbRecord> = {
  "esp32-devkit-v1": {
    id: "esp32-devkit-v1",
    displayName: "ESP32 DevKit v1",
    category: "board",
    manufacturer: "Espressif (generic devkit)",
    voltage: { logic: 3.3, input: [5, 12], regulatedOnBoard: true },
    communication: ["gpio", "i2c", "spi", "uart", "adc", "pwm"],
    power: {
      pins: [
        { name: "3V3", type: "power_out", voltage: 3.3, maxCurrentMa: 600 },
        { name: "5V", type: "power_out", voltage: 5.0, note: "only if fed via VIN/USB" },
        { name: "GND", type: "ground" },
      ],
    },
    pins: [
      { name: "GPIO4", type: "digital", capabilities: ["input", "output", "pwm"] },
      { name: "GPIO5", type: "spi", role: "CS", capabilities: ["spi_cs", "pwm"] },
      { name: "GPIO18", type: "spi", role: "SCK", capabilities: ["spi_clk"] },
      { name: "GPIO19", type: "spi", role: "MISO", capabilities: ["spi_miso"] },
      { name: "GPIO21", type: "i2c", role: "SDA", default: true },
      { name: "GPIO22", type: "i2c", role: "SCL", default: true },
      { name: "GPIO23", type: "spi", role: "MOSI", capabilities: ["spi_mosi"] },
      { name: "GPIO34", type: "adc", inputOnly: true },
      { name: "GPIO35", type: "adc", inputOnly: true },
      { name: "GPIO36", type: "adc", inputOnly: true },
      { name: "GPIO39", type: "adc", inputOnly: true },
    ],
    conflicts: [
      { pins: ["GPIO6", "GPIO7", "GPIO8", "GPIO9", "GPIO10", "GPIO11"], reason: "connected to internal flash, do not use" },
    ],
    renderHints: { icon: "esp32-board.svg", swappableWith: ["esp32-s3", "esp32-c3", "arduino-uno"] },
    verified: true,
    source: "https://docs.espressif.com/projects/esp-idf/en/latest/esp32/hw-reference/esp32/get-started-devkitc.html",
    schemaVersion: "1.0.0",
  },
  "esp32-c3-devkitm-1": {
    id: "esp32-c3-devkitm-1",
    displayName: "Espressif ESP32-C3-DevKitM-1",
    category: "board",
    manufacturer: "Espressif",
    voltage: { logic: 3.3, input: [5, 5], regulatedOnBoard: true },
    communication: ["gpio", "i2c", "spi", "uart", "adc", "pwm"],
    power: {
      pins: [
        { name: "3V3", type: "power_out", voltage: 3.3, maxCurrentMa: 500 },
        { name: "5V", type: "power_out", voltage: 5.0 },
        { name: "GND", type: "ground" },
      ],
    },
    pins: [
      { name: "GPIO0", type: "digital", capabilities: ["gpio", "adc", "pwm"] },
      { name: "GPIO1", type: "digital", capabilities: ["gpio", "adc", "pwm"] },
      { name: "GPIO2", type: "digital", capabilities: ["gpio", "adc", "pwm"] },
      { name: "GPIO3", type: "digital", capabilities: ["gpio", "adc", "pwm"] },
      { name: "GPIO4", type: "digital", capabilities: ["gpio", "adc", "pwm"] },
      { name: "GPIO5", type: "spi", role: "CS", capabilities: ["gpio", "spi_cs", "pwm"] },
      { name: "GPIO6", type: "spi", role: "SCK", capabilities: ["gpio", "spi_clk", "pwm"] },
      { name: "GPIO7", type: "spi", role: "MOSI", capabilities: ["gpio", "spi_mosi", "pwm"] },
      { name: "GPIO8", type: "i2c", role: "SDA", default: true },
      { name: "GPIO9", type: "i2c", role: "SCL", default: true },
      { name: "GPIO10", type: "spi", role: "MISO", capabilities: ["gpio", "spi_miso", "pwm"] },
    ],
    verified: true,
    schemaVersion: "1.0.0",
  },
  "arduino-uno": {
    id: "arduino-uno",
    displayName: "Arduino Uno R3",
    category: "board",
    manufacturer: "Arduino",
    voltage: { logic: 5.0, input: [7, 12], regulatedOnBoard: true },
    communication: ["gpio", "i2c", "spi", "uart", "adc", "pwm"],
    power: {
      pins: [
        { name: "5V", type: "power_out", voltage: 5.0, maxCurrentMa: 500 },
        { name: "3V3", type: "power_out", voltage: 3.3, maxCurrentMa: 50 },
        { name: "GND", type: "ground" },
      ],
    },
    pins: [
      { name: "D2", type: "digital" },
      { name: "D3", type: "digital", capabilities: ["pwm"] },
      { name: "D4", type: "digital" },
      { name: "D5", type: "digital", capabilities: ["pwm"] },
      { name: "D6", type: "digital", capabilities: ["pwm"] },
      { name: "D7", type: "digital" },
      { name: "D8", type: "digital" },
      { name: "D9", type: "digital", capabilities: ["pwm"] },
      { name: "D10", type: "spi", role: "CS", capabilities: ["pwm"] },
      { name: "D11", type: "spi", role: "MOSI", capabilities: ["pwm"] },
      { name: "D12", type: "spi", role: "MISO" },
      { name: "D13", type: "spi", role: "SCK" },
      { name: "A0", type: "adc" },
      { name: "A1", type: "adc" },
      { name: "A2", type: "adc" },
      { name: "A3", type: "adc" },
      { name: "A4", type: "i2c", role: "SDA" },
      { name: "A5", type: "i2c", role: "SCL" },
    ],
    verified: true,
    schemaVersion: "1.0.0",
  },
  "dht22": {
    id: "dht22",
    displayName: "DHT22 Temperature & Humidity Sensor",
    category: "sensor",
    voltage: { logic: [3.3, 5.5] },
    communication: ["single-wire"],
    pins: [
      { name: "VCC", type: "power_in" },
      { name: "DATA", type: "digital", role: "single-wire-data", requiresPullup: { toPin: "VCC", ohms: [4700, 10000], note: "many breakout boards include on-board pullup" } },
      { name: "GND", type: "ground" },
    ],
    timing: { minSamplePeriodMs: 2000 },
    libraries: ["DHT sensor library by Adafruit", "Adafruit Unified Sensor"],
    renderHints: { icon: "dht22.svg" },
    verified: true,
    source: "https://www.sparkfun.com/datasheets/Sensors/Temperature/DHT22.pdf",
    schemaVersion: "1.0.0",
  },
  "dht11": {
    id: "dht11",
    displayName: "DHT11 Temperature & Humidity Sensor",
    category: "sensor",
    voltage: { logic: [3.3, 5.0] },
    communication: ["single-wire"],
    pins: [
      { name: "VCC", type: "power_in" },
      { name: "DATA", type: "digital", role: "single-wire-data" },
      { name: "GND", type: "ground" },
    ],
    timing: { minSamplePeriodMs: 1000 },
    libraries: ["DHT sensor library by Adafruit"],
    verified: true,
    schemaVersion: "1.0.0",
  },
  "ssd1306-oled-128x64": {
    id: "ssd1306-oled-128x64",
    displayName: "SSD1306 OLED 128x64",
    category: "display",
    voltage: { logic: [3.3, 5.0] },
    communication: ["i2c"],
    pins: [
      { name: "VCC", type: "power_in" },
      { name: "GND", type: "ground" },
      { name: "SDA", type: "i2c", role: "SDA" },
      { name: "SCL", type: "i2c", role: "SCL" },
    ],
    libraries: ["Adafruit_SSD1306", "Adafruit_GFX"],
    renderHints: { icon: "ssd1306.svg" },
    verified: true,
    source: "https://cdn-shop.adafruit.com/datasheets/SSD1306.pdf",
    schemaVersion: "1.0.0",
  },
  "bmp280": {
    id: "bmp280",
    displayName: "BMP280 Barometric Pressure & Temperature Sensor",
    category: "sensor",
    voltage: { logic: [1.71, 3.6] },
    communication: ["i2c", "spi"],
    pins: [
      { name: "VCC", type: "power_in" },
      { name: "GND", type: "ground" },
      { name: "SDA", type: "i2c", role: "SDA" },
      { name: "SCL", type: "i2c", role: "SCL" },
    ],
    libraries: ["Adafruit BMP280 Library"],
    verified: true,
    schemaVersion: "1.0.0",
  },
  "hc-sr04": {
    id: "hc-sr04",
    displayName: "HC-SR04 Ultrasonic Distance Sensor",
    category: "sensor",
    voltage: { logic: 5.0 },
    communication: ["gpio"],
    pins: [
      { name: "VCC", type: "power_in" },
      { name: "TRIG", type: "digital", role: "output" },
      { name: "ECHO", type: "digital", role: "input" },
      { name: "GND", type: "ground" },
    ],
    libraries: ["NewPing"],
    verified: true,
    schemaVersion: "1.0.0",
  },
  "sg90-servo": {
    id: "sg90-servo",
    displayName: "SG90 Micro Servo Motor",
    category: "actuator",
    voltage: { logic: [4.8, 6.0] },
    communication: ["pwm"],
    pins: [
      { name: "VCC", type: "power_in" },
      { name: "GND", type: "ground" },
      { name: "SIGNAL", type: "pwm", role: "pwm_input" },
    ],
    libraries: ["ESP32Servo", "Servo"],
    verified: true,
    schemaVersion: "1.0.0",
  },
  "relay-module-5v": {
    id: "relay-module-5v",
    displayName: "5V Single Channel Relay Module",
    category: "actuator",
    voltage: { logic: 5.0 },
    communication: ["gpio"],
    pins: [
      { name: "VCC", type: "power_in" },
      { name: "GND", type: "ground" },
      { name: "IN", type: "digital" },
    ],
    verified: true,
    schemaVersion: "1.0.0",
  },
  "ws2812b-neopixel": {
    id: "ws2812b-neopixel",
    displayName: "WS2812B / NeoPixel LED Strip",
    category: "actuator",
    voltage: { logic: 5.0 },
    communication: ["single-wire"],
    pins: [
      { name: "VCC", type: "power_in" },
      { name: "GND", type: "ground" },
      { name: "DIN", type: "digital" },
    ],
    libraries: ["Adafruit NeoPixel", "FastLED"],
    verified: true,
    schemaVersion: "1.0.0",
  },
  "gc9a01-round-tft-spi": {
    id: "gc9a01-round-tft-spi",
    displayName: "GC9A01 Round TFT Display 1.28 inch",
    category: "display",
    voltage: { logic: [3.3, 5.0] },
    communication: ["spi"],
    pins: [
      { name: "VCC", type: "power_in" },
      { name: "GND", type: "ground" },
      { name: "SCL", type: "spi", role: "SCK" },
      { name: "SDA", type: "spi", role: "MOSI" },
      { name: "DC", type: "digital" },
      { name: "CS", type: "spi", role: "CS" },
      { name: "RST", type: "digital" },
    ],
    libraries: ["Arduino_GC9A01", "Adafruit_GFX"],
    verified: true,
    schemaVersion: "1.0.0",
  },
  "led": {
    id: "led",
    displayName: "Standard LED",
    category: "actuator",
    voltage: { logic: [1.8, 3.3] },
    communication: ["gpio"],
    pins: [
      { name: "ANODE", type: "digital", role: "positive" },
      { name: "CATHODE", type: "ground", role: "negative" },
    ],
    verified: true,
    schemaVersion: "1.0.0",
  },
  "mpu6050": {
    id: "mpu6050",
    displayName: "MPU-6050 6-Axis Accelerometer & Gyroscope",
    category: "sensor",
    voltage: { logic: [3.3, 5.0] },
    communication: ["i2c"],
    pins: [
      { name: "VCC", type: "power_in" },
      { name: "GND", type: "ground" },
      { name: "SDA", type: "i2c", role: "SDA" },
      { name: "SCL", type: "i2c", role: "SCL" },
      { name: "INT", type: "digital" },
    ],
    libraries: ["MPU6050"],
    verified: true,
    schemaVersion: "1.0.0",
  },
  "max30102": {
    id: "max30102",
    displayName: "MAX30102 Heart Rate & SpO2 Sensor",
    category: "sensor",
    voltage: { logic: 3.3 },
    communication: ["i2c"],
    pins: [
      { name: "VCC", type: "power_in" },
      { name: "GND", type: "ground" },
      { name: "SDA", type: "i2c", role: "SDA" },
      { name: "SCL", type: "i2c", role: "SCL" },
      { name: "INT", type: "digital" },
    ],
    libraries: ["SparkFun MAX3010x Pulse and Proximity Sensor"],
    verified: true,
    schemaVersion: "1.0.0",
  },
  "ds18b20": {
    id: "ds18b20",
    displayName: "DS18B20 1-Wire Temperature Sensor",
    category: "sensor",
    voltage: { logic: [3.0, 5.5] },
    communication: ["single-wire"],
    pins: [
      { name: "VCC", type: "power_in" },
      { name: "DATA", type: "single-wire", requiresPullup: { toPin: "VCC", ohms: [4700, 4700], note: "4.7k ohm pullup required between DATA and VCC" } },
      { name: "GND", type: "ground" },
    ],
    libraries: ["DallasTemperature", "OneWire"],
    verified: true,
    schemaVersion: "1.0.0",
  },
};

/** Get formatted EDB specs for prompt injection */
export function getEdbSpecsContext(detectedIds: string[]): string {
  const records = Object.values(EDB).filter(
    (r) => detectedIds.includes(r.id) || r.category === "board"
  );

  return JSON.stringify(records, null, 2);
}
