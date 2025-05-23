import { create } from "zustand";
import { QueueSystem } from "./queueSystem"; // Import the queue system

export interface StateRecord {
  value: boolean | string | number | any[] | Record<string, any>;
  lastUpdate: number;
}

interface State {
  [key: string]: StateRecord;
}

interface Device {
  id: string;
  state: State;
}

interface DeviceState {
  devices: Record<string, Device>;
  updateDeviceState: (
    id: string,
    key: string,
    record: StateRecord,
    syncToCloud?: boolean
  ) => void;
  removeDevice: (id: string) => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  devices: {},
  // Update a specific state record for a device or create a new one if it doesn't exist
  updateDeviceState: (id, key, record, syncToCloud = true) => {
    set((state) => {
      let device = state.devices[id];
      if (!device) {
        console.warn(`Device with ID ${id} not found. Creating a new record.`);
        device = { id, state: {} }; // Create a new device record
      }

      const updatedDevice = {
        ...device,
        state: {
          ...device.state,
          [key]: record,
        },
      };

      // Push the updated state to the queue system only if syncToCloud is true
      if (syncToCloud) {
        console.log(`Store: Queueing update for cloud sync: ${id}.${key}`);
        QueueSystem.push({
          type: "UPDATE_DEVICE_STATE",
          payload: { id, key, record },
        });
      } else {
        console.log(
          `Store: Skipping cloud sync for ${id}.${key} (from cloud update)`
        );
      }

      return {
        devices: {
          ...state.devices,
          [id]: updatedDevice,
        },
      };
    });
  },
  // Remove a device from the store
  removeDevice: (id) =>
    set((state) => {
      const { [id]: _, ...remainingDevices } = state.devices;
      // Return the updated state
      return { devices: remainingDevices };
    }),
}));
