import type { Component } from "@/lib/types";

export interface ComponentWithAliases extends Component {
  aliases: string[];
}

export const COMPONENTS: ComponentWithAliases[] = [
  {
    id: "dht22",
    name: "DHT22 Temperature & Humidity Sensor",
    category: "sensor",
    description: "Digital temperature and humidity sensor, 1-wire protocol",
    defaultLibrary: "DHT sensor library by Adafruit",
    aliases: ["dht22", "dht-22", "dht 22", "am2302"],
    defaultPinsJson: [
      { name: "VCC", type: "power" },
      { name: "DATA", type: "signal" },
      { name: "GND", type: "ground" },
    ],
  },
  {
    id: "dht11",
    name: "DHT11 Temperature & Humidity Sensor",
    category: "sensor",
    description: "Basic digital temperature and humidity sensor",
    defaultLibrary: "DHT sensor library by Adafruit",
    aliases: ["dht11", "dht-11", "dht 11"],
    defaultPinsJson: [
      { name: "VCC", type: "power" },
      { name: "DATA", type: "signal" },
      { name: "GND", type: "ground" },
    ],
  },
  {
    id: "ssd1306-oled-128x64",
    name: "OLED Display 128x64 SSD1306 (I2C)",
    category: "display",
    description: '0.96" OLED display, 128x64 pixels, I2C interface',
    defaultLibrary: "Adafruit_SSD1306",
    aliases: ["ssd1306", "oled", "128x64", "i2c display", "oled display"],
    defaultPinsJson: [
      { name: "VCC", type: "power" },
      { name: "GND", type: "ground" },
      { name: "SDA", type: "data" },
      { name: "SCL", type: "clock" },
    ],
  },
  {
    id: "gc9a01-round-tft-spi",
    name: "Round TFT Display 1.28\" GC9A01 (SPI)",
    category: "display",
    description: '1.28" round TFT LCD display, 240x240 pixels, SPI interface',
    defaultLibrary: "Arduino_GC9A01",
    aliases: ["gc9a01", "round tft", "round display", "spi display"],
    defaultPinsJson: [
      { name: "VCC", type: "power" },
      { name: "GND", type: "ground" },
      { name: "SCL", type: "clock" },
      { name: "SDA", type: "data" },
      { name: "DC", type: "signal" },
      { name: "CS", type: "signal" },
      { name: "RST", type: "signal" },
    ],
  },
  {
    id: "bmp280",
    name: "BMP280 Barometric Pressure Sensor",
    category: "sensor",
    description: "Temperature and barometric pressure sensor, I2C/SPI",
    defaultLibrary: "Adafruit_BMP280",
    aliases: ["bmp280", "bmp 280", "bme280", "bme 280", "pressure sensor", "barometric"],
    defaultPinsJson: [
      { name: "VCC", type: "power" },
      { name: "GND", type: "ground" },
      { name: "SDA", type: "data" },
      { name: "SCL", type: "clock" },
    ],
  },
  {
    id: "hc-sr04",
    name: "HC-SR04 Ultrasonic Distance Sensor",
    category: "sensor",
    description: "Ultrasonic distance sensor, 2cm–400cm range",
    defaultLibrary: "NewPing",
    aliases: ["hc-sr04", "hcsr04", "hc sr04", "ultrasonic", "distance sensor"],
    defaultPinsJson: [
      { name: "VCC", type: "power" },
      { name: "TRIG", type: "signal" },
      { name: "ECHO", type: "signal" },
      { name: "GND", type: "ground" },
    ],
  },
  {
    id: "sg90-servo",
    name: "SG90 Servo Motor",
    category: "actuator",
    description: "Micro servo motor, 0-180 degrees, PWM control",
    defaultLibrary: "ESP32Servo",
    aliases: ["sg90", "servo", "servo motor", "micro servo"],
    defaultPinsJson: [
      { name: "VCC", type: "power" },
      { name: "GND", type: "ground" },
      { name: "SIGNAL", type: "signal" },
    ],
  },
  {
    id: "led",
    name: "LED",
    category: "actuator",
    description: "Standard LED with current-limiting resistor",
    defaultLibrary: "",
    aliases: ["led", "light emitting diode"],
    defaultPinsJson: [
      { name: "ANODE", type: "signal" },
      { name: "CATHODE", type: "ground" },
    ],
  },
  {
    id: "relay-module-5v",
    name: "5V Relay Module",
    category: "actuator",
    description: "Single-channel 5V relay module",
    defaultLibrary: "",
    aliases: ["relay", "relay module", "5v relay"],
    defaultPinsJson: [
      { name: "VCC", type: "power" },
      { name: "GND", type: "ground" },
      { name: "IN", type: "signal" },
    ],
  },
  {
    id: "mpu6050",
    name: "MPU-6050 Accelerometer & Gyroscope",
    category: "sensor",
    description: "6-axis IMU with I2C interface",
    defaultLibrary: "MPU6050 by Electronic Cats",
    aliases: ["mpu6050", "mpu-6050", "gyroscope", "accelerometer", "imu"],
    defaultPinsJson: [
      { name: "VCC", type: "power" },
      { name: "GND", type: "ground" },
      { name: "SDA", type: "data" },
      { name: "SCL", type: "clock" },
      { name: "INT", type: "signal" },
    ],
  },
  {
    id: "max30102",
    name: "MAX30102 Heart Rate & SpO2 Sensor",
    category: "sensor",
    description: "Pulse oximetry and heart rate sensor, I2C interface",
    defaultLibrary: "SparkFun MAX3010x Pulse and Proximity Sensor",
    aliases: ["max30102", "max30100", "heart rate", "spo2", "pulse sensor"],
    defaultPinsJson: [
      { name: "VCC", type: "power" },
      { name: "GND", type: "ground" },
      { name: "SDA", type: "data" },
      { name: "SCL", type: "clock" },
      { name: "INT", type: "signal" },
    ],
  },
  {
    id: "ws2812b-neopixel",
    name: "NeoPixel / WS2812B LED Strip",
    category: "actuator",
    description: "Addressable RGB LED strip, single data wire",
    defaultLibrary: "Adafruit NeoPixel",
    aliases: ["neopixel", "ws2812", "ws2812b", "led strip", "rgb led strip"],
    defaultPinsJson: [
      { name: "VCC", type: "power" },
      { name: "GND", type: "ground" },
      { name: "DIN", type: "data" },
    ],
  },
  {
    id: "ds18b20",
    name: "DS18B20 Temperature Sensor",
    category: "sensor",
    description: "1-Wire digital temperature sensor, waterproof variant available",
    defaultLibrary: "DallasTemperature",
    aliases: ["ds18b20", "ds1820", "waterproof temperature", "1-wire temperature"],
    defaultPinsJson: [
      { name: "VCC", type: "power" },
      { name: "DATA", type: "signal" },
      { name: "GND", type: "ground" },
    ],
  },
];

export const COMPONENT_MAP = Object.fromEntries(
  COMPONENTS.map((c) => [c.id, c])
);

/** Detect relevant components from a natural language prompt using precise alias matching */
export function detectComponents(prompt: string): Component[] {
  const lower = prompt.toLowerCase();
  return COMPONENTS.filter((c) => {
    return c.aliases.some((alias) => lower.includes(alias.toLowerCase()));
  });
}

export function getComponentContext(detectedComponents: Component[]): string {
  if (detectedComponents.length === 0) {
    return "No specific components detected — use appropriate defaults.";
  }

  return detectedComponents
    .map(
      (c) =>
        `Component: ${c.name} (id: ${c.id}, category: ${c.category})
  Default library: ${c.defaultLibrary || "none"}
  Pins: ${c.defaultPinsJson.map((p) => `${p.name}(${p.type})`).join(", ")}`
    )
    .join("\n\n");
}
