import { DeviceEventEmitter } from "react-native";

export class MockBLEDevice {
  public id: string; // Unique identifier for the device
  private connected: boolean;
  private batteryLevel: number;
  private pressureLevel: number;

  constructor() {
    this.id = "mock-device-id"; // Unique identifier for the mock device
    this.connected = false;
    this.batteryLevel = 100; // Default battery level
    this.pressureLevel = 0; // Default pressure level
  }

  // Connect to the mock device
  connect(id: string): void {
    if (!this.connected) {
      this.connected = true;
      DeviceEventEmitter.emit("connectionChange", {
        id: id ?? this.id,
        connected: this.connected,
      });
    }
  }

  // Disconnect from the mock device
  disconnect(id: string): void {
    if (this.connected) {
      this.connected = false;
      DeviceEventEmitter.emit("connectionChange", {
        id: id ?? this.id,
        connected: this.connected,
      });
    }
  }

  setPressureLevel(id: string, level: number): void {
    if (this.connected) {
      this.pressureLevel = level;
      DeviceEventEmitter.emit("pressureLevelChange", {
        id: id ?? this.id,
        level: this.pressureLevel,
      });
    }
  }

  // Check if the device is connected
  isConnected(): boolean {
    return this.connected;
  }

  // Get the current battery status
  getBatteryStatus(): number {
    return this.batteryLevel;
  }

  // Get the current pressure level
  getPressureLevel(): number {
    return this.pressureLevel;
  }

  // Simulate battery drain (optional for testing)
  simulateBatteryDrain(): void {
    if (this.batteryLevel > 0) {
      this.batteryLevel -= 10;
      if (this.batteryLevel < 0) this.batteryLevel = 0;
    }
  }

  // Subscribe to connection state changes
  onConnectionChange(callback: (id: string, connected: boolean) => void): void {
    DeviceEventEmitter.addListener("connectionChange", (data: any) => {
      const { id, connected } = data;
      callback(id, connected);
    });
  }

  // Unsubscribe from connection state changes
  offConnectionChange(): void {
    DeviceEventEmitter.removeAllListeners("connectionChange");
  }

  // Subscribe to device status changes
  onPressureLevelChange(callback: (id: string, level: number) => void): void {
    DeviceEventEmitter.addListener("pressureLevelChange", (data: any) => {
      const { id, level } = data;
      console.log("Pressure level change event received", data);
      callback(id, level);
    });
  }

  // Unsubscribe from device status changes
  offDeviceStatusChange(): void {
    DeviceEventEmitter.removeAllListeners("pressureLevelChange");
  }
}
