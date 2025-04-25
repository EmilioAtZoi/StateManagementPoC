import { create } from "zustand";
import { QueueSystem } from "../queueSystem"; // Import the queue system

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
  addDevice: (id: string) => Promise<void>;
  updateDeviceState: (id: string, key: string, record: StateRecord) => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  devices: {},
  addDevice: async (id) => {
    try {
      const newDevice: Device = {
        id,
        state: {},
      };

      set((state) => ({
        devices: {
          ...state.devices,
          [newDevice.id]: newDevice,
        },
      }));

      // Push the new device to the queue system
      QueueSystem.push({
        type: "ADD_DEVICE",
        payload: { id },
      });
    } catch (error) {
      console.error("Failed to register device:", error);
    }
  },

  // Update a specific state record for a device
  updateDeviceState: (id, key, record) => {
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

      // Push the updated state to the queue system
      QueueSystem.push({
        type: "UPDATE_DEVICE_STATE",
        payload: { id, key, record },
      });

      return {
        devices: {
          ...state.devices,
          [id]: updatedDevice,
        },
      };
    });
  },
}));
