import { DeviceEventEmitter } from "react-native";

export class MockBLEDevice {
  public id: string; // Unique identifier for the device
  private connected: boolean;
  private batteryLevel: number;

  constructor() {
    this.id = "mock-device-id"; // Unique identifier for the mock device
    this.connected = false;
    this.batteryLevel = 100; // Default battery level
  }

  // Connect to the mock device
  connect(id: string): void {
    if (!this.connected) {
      this.connected = true;
      DeviceEventEmitter.emit("connectionChange", {
        id: id ?? this.id,
        connected: this.connected,
      });
      DeviceEventEmitter.emit("deviceStatusChange", {
        id: id ?? this.id,
        status: { connected: this.connected },
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
      DeviceEventEmitter.emit("deviceStatusChange", {
        id: id ?? this.id,
        status: { connected: this.connected },
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
  onDeviceStatusChange(
    callback: (id: string, status: { connected: boolean }) => void
  ): void {
    DeviceEventEmitter.addListener("deviceStatusChange", (data: any) => {
      const { id, status } = data;
      if (status && typeof status.connected === "boolean") {
        callback(id, status);
      } else {
        console.error("Invalid status payload:", status);
      }
    });
  }

  // Unsubscribe from device status changes
  offDeviceStatusChange(): void {
    DeviceEventEmitter.removeAllListeners("deviceStatusChange");
  }
}
