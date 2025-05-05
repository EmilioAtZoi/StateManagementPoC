import { DeviceEventEmitter } from "react-native"; // Correct usage of DeviceEventEmitter
import { MockBLEDevice } from "../mocks/MockBLEDevice";

export class BLEManager {
  private static mockDevice = new MockBLEDevice();

  static initialize() {
    // Subscribe to connection change events from the mock device
    BLEManager.mockDevice.onConnectionChange(
      (id: string, connected: boolean) => {
        const event = connected ? "deviceConnected" : "deviceDisconnected";
        DeviceEventEmitter.emit(event, {
          id: id,
          key: "online",
          record: { value: connected, lastUpdate: Date.now() },
        });
      }
    );

    BLEManager.mockDevice.onPressureLevelChange((id: string, level: number) => {
      console.log("BLEManager: Pressure level changed", id, level);
      DeviceEventEmitter.emit("pressureLevelChanged", {
        id: id,
        key: "pressureLevel",
        record: { value: level, lastUpdate: Date.now() },
      });
    });
  }

  static async connectToDevice(id: string) {
    setTimeout(() => {
      BLEManager.mockDevice.connect(id); // Trigger the mock device connection
    }, 1000);
  }

  static async disconnectFromDevice(id: string) {
    setTimeout(() => {
      BLEManager.mockDevice.disconnect(id); // Trigger the mock device disconnection
    }, 1000);
  }

  static async setPressureLevel(id: string, level: number) {
    setTimeout(() => {
      BLEManager.mockDevice.setPressureLevel(id, level); // Trigger the mock device pressure level change
    }, 1000);
  }

  // Public methods to access events
  static on(
    event: "deviceConnected" | "deviceDisconnected" | "pressureLevelChanged",
    listener: (data: { id: string; key: string; record: any }) => void
  ) {
    DeviceEventEmitter.addListener(event, listener);
  }

  static off(
    event: "deviceConnected" | "deviceDisconnected" | "pressureLevelChanged"
  ) {
    DeviceEventEmitter.removeAllListeners(event);
  }
}
