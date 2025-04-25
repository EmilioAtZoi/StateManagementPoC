import { BLEManager } from "../bleManager";
import { useDeviceStore } from "../state/store";

export class BLEEventHandler {
  static initialize() {
    const { updateDeviceState } = useDeviceStore.getState();

    // Handle device connection events
    BLEManager.on("deviceConnected", (data) => {
      console.log(`BLEEventHandler: Device ${data.id} connected`);
      updateDeviceState(data.id, data.key, data.record); // Update the store
    });

    // Handle device disconnection events
    BLEManager.on("deviceDisconnected", (data) => {
      console.log(`BLEEventHandler: Device ${data.id} disconnected`);
      updateDeviceState(data.id, data.key, data.record); // Update the store
    });

    // Handle generic state change events
    BLEManager.on("stateChange", (data) => {
      console.log(`BLEEventHandler: State change for device ${data.id}`, data);
      updateDeviceState(data.id, data.key, data.record); // Update the store
    });
  }

  static cleanup() {
    // Remove all listeners to avoid memory leaks
    BLEManager.off("deviceConnected");
    BLEManager.off("deviceDisconnected");
    BLEManager.off("stateChange");
  }
}
