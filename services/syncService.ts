import React from "react";
import { useThings, State } from "../mocks/MockCloud";
import { useDeviceStore } from "../state/store";

// Singleton to access the cloud state without using hooks directly
class CloudSyncManager {
  private static instance: CloudSyncManager;
  private thingsHook: ReturnType<typeof useThings> | null = null;

  private constructor() {}

  static getInstance(): CloudSyncManager {
    if (!CloudSyncManager.instance) {
      CloudSyncManager.instance = new CloudSyncManager();
    }
    return CloudSyncManager.instance;
  }

  // Initialize with a useThings instance (call this from a React component)
  initialize(thingsHookInstance: ReturnType<typeof useThings>) {
    this.thingsHook = thingsHookInstance;
    console.log("CloudSyncManager initialized with cloud data");
  }

  // Get a device's state from the cloud
  getDeviceState(deviceId: string): State | undefined {
    if (!this.thingsHook) {
      console.error("CloudSyncManager not initialized!");
      return undefined;
    }

    const device = this.thingsHook.things.find(
      (thing) => thing.id === deviceId
    );
    return device?.state;
  }

  // Update device state in the cloud, with timestamp comparison
  async updateDeviceState(deviceId: string, key: string, newState: any) {
    if (!this.thingsHook) {
      console.error("CloudSyncManager not initialized!");
      return;
    }

    // Get current cloud state
    const device = this.thingsHook.things.find(
      (thing) => thing.id === deviceId
    );
    const cloudState = device?.state;

    // Compare timestamps
    const localTimestamp = newState.lastUpdate;
    const cloudTimestamp = (cloudState && cloudState[key]?.lastUpdate) || 0;

    if (localTimestamp > cloudTimestamp) {
      // Local state is newer, update the cloud
      console.log(
        `CloudSyncManager: Local state is newer (${localTimestamp} > ${cloudTimestamp}), updating cloud`
      );

      // Create updated state object
      const updatedState: State = { ...(cloudState || {}) };
      updatedState[key] = newState;

      // Update the cloud
      await this.thingsHook.updateThing(deviceId, updatedState);
    } else {
      console.log(
        `CloudSyncManager: Cloud state is newer or equal (${cloudTimestamp} >= ${localTimestamp}), no update needed`
      );
    }
  }
}

export const cloudSyncManager = CloudSyncManager.getInstance();

// React hook to initialize and use the CloudSyncManager
export const useCloudSync = () => {
  const thingsHook = useThings();
  const { devices, updateDeviceState } = useDeviceStore();

  // Initialize the manager with the hook instance
  React.useEffect(() => {
    cloudSyncManager.initialize(thingsHook);

    // Setup periodic sync
    const syncInterval = setInterval(() => {
      syncLocalAndCloud();
    }, 30000); // Every 30 seconds

    return () => clearInterval(syncInterval);
  }, [thingsHook]);

  // Function to sync cloud changes to local state
  const syncLocalAndCloud = () => {
    // For each device in the cloud, check if local state needs update
    thingsHook.things.forEach((cloudDevice) => {
      if (cloudDevice.state) {
        const localDevice = devices[cloudDevice.id];

        // For each state key in the cloud device
        Object.entries(cloudDevice.state).forEach(([key, cloudRecord]) => {
          const localRecord = localDevice?.state?.[key];

          // If local record doesn't exist or cloud record is newer
          if (!localRecord || cloudRecord.lastUpdate > localRecord.lastUpdate) {
            console.log(
              `CloudSync: Cloud has newer state for ${cloudDevice.id}:${key}, updating local`
            );
            updateDeviceState(cloudDevice.id, key, cloudRecord);
          }
        });
      }
    });
  };

  return {
    syncNow: syncLocalAndCloud,
    cloudDevices: thingsHook.things,
    isLoading: thingsHook.isLoading,
  };
};
