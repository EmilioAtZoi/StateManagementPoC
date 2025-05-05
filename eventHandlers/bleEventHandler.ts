import { BLEManager } from "../ble/bleManager";
import { useDeviceStore } from "../state/store";

export class BLEEventHandler {
  private static initialized = false;

  static initialize() {
    if (this.initialized) return;

    // Get the store's update function directly
    const { updateDeviceState } = useDeviceStore.getState();

    // Handle device connected events
    BLEManager.on("deviceConnected", (data) => {
      console.log("BLE Event: Device connected", data);

      // Update the store with the new connection state
      updateDeviceState(data.id, data.key, data.record);
    });

    // Handle device disconnected events
    BLEManager.on("deviceDisconnected", (data) => {
      console.log("BLE Event: Device disconnected", data);

      // Update the store with the new connection state
      updateDeviceState(data.id, data.key, data.record);
    });

    // Handle pressure level change events
    BLEManager.on("pressureLevelChanged", (data) => {
      console.log("BLE Event: Pressure level changed", data);

      // Update the store with the new pressure level
      updateDeviceState(data.id, data.key, data.record);
    });

    this.initialized = true;
  }

  static cleanup() {
    BLEManager.off("deviceConnected");
    BLEManager.off("deviceDisconnected");
    BLEManager.off("pressureLevelChanged");
    this.initialized = false;
  }
}
