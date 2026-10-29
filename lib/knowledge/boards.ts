import type { Board } from "@/lib/types";

export const BOARDS: Board[] = [
  {
    id: "esp32-devkitc",
    name: "Espressif ESP32-DevKitC",
    mcu: "ESP32",
    pinoutJson: [
      { id: "3V3", label: "3.3V", capabilities: ["3v3"] },
      { id: "GND", label: "GND", capabilities: ["gnd"] },
      { id: "5V", label: "5V (VIN)", capabilities: ["5v"] },
      { id: "GPIO0", label: "GPIO0", capabilities: ["gpio", "adc", "pwm", "boot"] },
      { id: "GPIO1", label: "GPIO1 / TX0", capabilities: ["gpio", "uart_tx"] },
      { id: "GPIO2", label: "GPIO2", capabilities: ["gpio", "adc", "pwm", "led"] },
      { id: "GPIO3", label: "GPIO3 / RX0", capabilities: ["gpio", "uart_rx"] },
      { id: "GPIO4", label: "GPIO4", capabilities: ["gpio", "adc", "pwm"] },
      { id: "GPIO5", label: "GPIO5 / SPI_CS", capabilities: ["gpio", "spi_cs", "pwm"] },
      { id: "GPIO12", label: "GPIO12", capabilities: ["gpio", "adc", "pwm", "spi_miso"] },
      { id: "GPIO13", label: "GPIO13", capabilities: ["gpio", "adc", "pwm"] },
      { id: "GPIO14", label: "GPIO14", capabilities: ["gpio", "adc", "pwm", "spi_clk"] },
      { id: "GPIO15", label: "GPIO15", capabilities: ["gpio", "adc", "pwm", "spi_cs"] },
      { id: "GPIO16", label: "GPIO16", capabilities: ["gpio", "uart_rx"] },
      { id: "GPIO17", label: "GPIO17", capabilities: ["gpio", "uart_tx"] },
      { id: "GPIO18", label: "GPIO18 / SPI_CLK", capabilities: ["gpio", "spi_clk"] },
      { id: "GPIO19", label: "GPIO19 / SPI_MISO", capabilities: ["gpio", "spi_miso"] },
      { id: "GPIO21", label: "GPIO21 / I2C_SDA", capabilities: ["gpio", "i2c_sda"] },
      { id: "GPIO22", label: "GPIO22 / I2C_SCL", capabilities: ["gpio", "i2c_scl"] },
      { id: "GPIO23", label: "GPIO23 / SPI_MOSI", capabilities: ["gpio", "spi_mosi"] },
      { id: "GPIO25", label: "GPIO25", capabilities: ["gpio", "adc", "dac", "pwm"] },
      { id: "GPIO26", label: "GPIO26", capabilities: ["gpio", "adc", "dac", "pwm"] },
      { id: "GPIO27", label: "GPIO27", capabilities: ["gpio", "adc", "pwm"] },
      { id: "GPIO32", label: "GPIO32", capabilities: ["gpio", "adc", "pwm"] },
      { id: "GPIO33", label: "GPIO33", capabilities: ["gpio", "adc", "pwm"] },
      { id: "GPIO34", label: "GPIO34", capabilities: ["gpio", "adc", "input_only"] },
      { id: "GPIO35", label: "GPIO35", capabilities: ["gpio", "adc", "input_only"] },
      { id: "GPIO36", label: "GPIO36", capabilities: ["gpio", "adc", "input_only"] },
      { id: "GPIO39", label: "GPIO39", capabilities: ["gpio", "adc", "input_only"] },
    ],
  },
  {
    id: "esp32-c3-devkitm-1",
    name: "Espressif ESP32-C3-DevKitM-1",
    mcu: "ESP32-C3",
    pinoutJson: [
      { id: "3V3", label: "3.3V", capabilities: ["3v3"] },
      { id: "GND", label: "GND", capabilities: ["gnd"] },
      { id: "5V", label: "5V (USB)", capabilities: ["5v"] },
      { id: "GPIO0", label: "GPIO0", capabilities: ["gpio", "adc", "pwm"] },
      { id: "GPIO1", label: "GPIO1", capabilities: ["gpio", "adc", "pwm"] },
      { id: "GPIO2", label: "GPIO2", capabilities: ["gpio", "adc", "pwm"] },
      { id: "GPIO3", label: "GPIO3", capabilities: ["gpio", "adc", "pwm"] },
      { id: "GPIO4", label: "GPIO4", capabilities: ["gpio", "adc", "pwm"] },
      { id: "GPIO5", label: "GPIO5 / SPI_CS", capabilities: ["gpio", "spi_cs", "pwm"] },
      { id: "GPIO6", label: "GPIO6 / SPI_CLK", capabilities: ["gpio", "spi_clk", "pwm"] },
      { id: "GPIO7", label: "GPIO7 / SPI_MOSI", capabilities: ["gpio", "spi_mosi", "pwm"] },
      { id: "GPIO8", label: "GPIO8 / I2C_SDA", capabilities: ["gpio", "i2c_sda", "pwm"] },
      { id: "GPIO9", label: "GPIO9 / I2C_SCL", capabilities: ["gpio", "i2c_scl", "pwm"] },
      { id: "GPIO10", label: "GPIO10 / SPI_MISO", capabilities: ["gpio", "spi_miso", "pwm"] },
      { id: "GPIO18", label: "GPIO18 / USB_D-", capabilities: ["gpio", "usb"] },
      { id: "GPIO19", label: "GPIO19 / USB_D+", capabilities: ["gpio", "usb"] },
      { id: "GPIO20", label: "GPIO20 / RX0", capabilities: ["gpio", "uart_rx"] },
      { id: "GPIO21", label: "GPIO21 / TX0", capabilities: ["gpio", "uart_tx"] },
    ],
  },
  {
    id: "arduino-uno",
    name: "Arduino Uno R3",
    mcu: "ATmega328P",
    pinoutJson: [
      { id: "5V", label: "5V", capabilities: ["5v"] },
      { id: "3V3", label: "3.3V", capabilities: ["3v3"] },
      { id: "GND", label: "GND", capabilities: ["gnd"] },
      { id: "D0", label: "D0 / RX", capabilities: ["gpio", "uart_rx"] },
      { id: "D1", label: "D1 / TX", capabilities: ["gpio", "uart_tx"] },
      { id: "D2", label: "D2", capabilities: ["gpio", "interrupt"] },
      { id: "D3", label: "D3", capabilities: ["gpio", "pwm", "interrupt"] },
      { id: "D4", label: "D4", capabilities: ["gpio"] },
      { id: "D5", label: "D5", capabilities: ["gpio", "pwm"] },
      { id: "D6", label: "D6", capabilities: ["gpio", "pwm"] },
      { id: "D7", label: "D7", capabilities: ["gpio"] },
      { id: "D8", label: "D8", capabilities: ["gpio"] },
      { id: "D9", label: "D9", capabilities: ["gpio", "pwm"] },
      { id: "D10", label: "D10 / SPI_CS", capabilities: ["gpio", "pwm", "spi_cs"] },
      { id: "D11", label: "D11 / SPI_MOSI", capabilities: ["gpio", "pwm", "spi_mosi"] },
      { id: "D12", label: "D12 / SPI_MISO", capabilities: ["gpio", "spi_miso"] },
      { id: "D13", label: "D13 / SPI_CLK", capabilities: ["gpio", "spi_clk"] },
      { id: "A0", label: "A0", capabilities: ["gpio", "adc"] },
      { id: "A1", label: "A1", capabilities: ["gpio", "adc"] },
      { id: "A2", label: "A2", capabilities: ["gpio", "adc"] },
      { id: "A3", label: "A3", capabilities: ["gpio", "adc"] },
      { id: "A4", label: "A4 / I2C_SDA", capabilities: ["gpio", "adc", "i2c_sda"] },
      { id: "A5", label: "A5 / I2C_SCL", capabilities: ["gpio", "adc", "i2c_scl"] },
    ],
  },
  {
    id: "arduino-nano",
    name: "Arduino Nano",
    mcu: "ATmega328P",
    pinoutJson: [
      { id: "5V", label: "5V", capabilities: ["5v"] },
      { id: "3V3", label: "3.3V", capabilities: ["3v3"] },
      { id: "GND", label: "GND", capabilities: ["gnd"] },
      { id: "D2", label: "D2", capabilities: ["gpio", "interrupt"] },
      { id: "D3", label: "D3", capabilities: ["gpio", "pwm", "interrupt"] },
      { id: "D4", label: "D4", capabilities: ["gpio"] },
      { id: "D5", label: "D5", capabilities: ["gpio", "pwm"] },
      { id: "D6", label: "D6", capabilities: ["gpio", "pwm"] },
      { id: "D7", label: "D7", capabilities: ["gpio"] },
      { id: "D8", label: "D8", capabilities: ["gpio"] },
      { id: "D9", label: "D9", capabilities: ["gpio", "pwm"] },
      { id: "D10", label: "D10 / SPI_CS", capabilities: ["gpio", "pwm", "spi_cs"] },
      { id: "D11", label: "D11 / SPI_MOSI", capabilities: ["gpio", "pwm", "spi_mosi"] },
      { id: "D12", label: "D12 / SPI_MISO", capabilities: ["gpio", "spi_miso"] },
      { id: "D13", label: "D13 / SPI_CLK", capabilities: ["gpio", "spi_clk"] },
      { id: "A0", label: "A0", capabilities: ["gpio", "adc"] },
      { id: "A1", label: "A1", capabilities: ["gpio", "adc"] },
      { id: "A2", label: "A2", capabilities: ["gpio", "adc"] },
      { id: "A3", label: "A3", capabilities: ["gpio", "adc"] },
      { id: "A4", label: "A4 / I2C_SDA", capabilities: ["gpio", "adc", "i2c_sda"] },
      { id: "A5", label: "A5 / I2C_SCL", capabilities: ["gpio", "adc", "i2c_scl"] },
    ],
  },
];

export const BOARD_MAP = Object.fromEntries(BOARDS.map((b) => [b.id, b]));

export function getBoardContext(boardId: string): string {
  const board = BOARD_MAP[boardId];
  if (!board) return "Unknown board — use standard ESP32 pinout.";

  const pins = board.pinoutJson
    .map((p) => `  - ${p.id} (${p.label}): ${p.capabilities.join(", ")}`)
    .join("\n");

  return `Board: ${board.name} (MCU: ${board.mcu})
Available pins:
${pins}`;
}
