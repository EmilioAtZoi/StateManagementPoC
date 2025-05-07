import React from "react";
import {
  State,
  fetchThings,
  updateThing,
  getThing,
  ThingData,
} from "../mocks/MockCloud";
import { useDeviceStore } from "../state/store";

// Standalone cloud sync functions
export const getAllCloudDevices = async (): Promise<ThingData[]> => {
  try {
    const { things } = await fetchThings();
    return things;
  } catch (error) {
    console.error("Error getting all devices:", error);
    return [];
  }
};

export const getCloudDeviceState = async (
  deviceId: string
): Promise<State | undefined> => {
  try {
    const device = await getThing(deviceId);
    return device?.state;
  } catch (error) {
    console.error("Error getting device state:", error);
    return undefined;
  }
};

export const updateCloudDeviceState = async (
  deviceId: string,
  key: string,
  newState: any
): Promise<boolean> => {
  try {
    // Get current cloud state
    const device = await getThing(deviceId);
    const cloudState = device?.state;

    // Compare timestamps
    const localTimestamp = newState.lastUpdate;
    const cloudTimestamp = (cloudState && cloudState[key]?.lastUpdate) || 0;

    if (localTimestamp > cloudTimestamp) {
      // Local state is newer, update the cloud
      console.log(
        `Cloud Sync: Local state is newer (${localTimestamp} > ${cloudTimestamp}), updating cloud`
      );

      // Create updated state object
      const updatedState: State = { ...(cloudState || {}) };
      updatedState[key] = newState;

      // Update the cloud
      const updateSuccess = await updateThing(deviceId, updatedState);
      return updateSuccess; // Return success status from updateThing
    } else {
      console.log(
        `Cloud Sync: Local state is not newer than cloud (${localTimestamp} <= ${cloudTimestamp}), no update needed`
      );
      return true; // Success - no update needed
    }
  } catch (error) {
    console.error("Error updating device state:", error);
    return false; // Failure - let the queue system retry
  }
};

// React hook to use cloud sync
export const useCloudSync = () => {
  const [cloudDevices, setCloudDevices] = React.useState<ThingData[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const { devices, updateDeviceState } = useDeviceStore();

  // Setup periodic sync
  React.useEffect(() => {
    const syncInterval = setInterval(() => {
      syncLocalAndCloud();
    }, 30000); // Every 30 seconds

    // Initial sync
    syncLocalAndCloud();

    return () => clearInterval(syncInterval);
  }, [devices]);

  // Function to sync cloud changes to local state
  const syncLocalAndCloud = async () => {
    try {
      setIsLoading(true);

      // Get all devices from cloud
      const cloudThings = await getAllCloudDevices();
      setCloudDevices(cloudThings);

      // For each device in the cloud, check if local state needs update
      for (const cloudDevice of cloudThings) {
        if (cloudDevice.state) {
          const localDevice = devices[cloudDevice.id];

          // For each state key in the cloud device
          Object.entries(cloudDevice.state).forEach(([key, cloudRecord]) => {
            const localRecord = localDevice?.state?.[key];

            // If local record doesn't exist or cloud record is newer
            if (
              !localRecord ||
              cloudRecord.lastUpdate > localRecord.lastUpdate
            ) {
              console.log(
                `CloudSync: Cloud has newer state for ${cloudDevice.id}:${key}, updating local`
              );
              // Pass false to prevent triggering a cloud sync back
              updateDeviceState(cloudDevice.id, key, cloudRecord, false);
            }
          });
        }
      }
    } catch (error) {
      console.error("Error syncing with cloud:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update function that handles bi-directional sync
  const updateDeviceStateAndSync = async (
    deviceId: string,
    key: string,
    newState: any
  ) => {
    // First update local state
    updateDeviceState(deviceId, key, newState);

    // Direct cloud update (bypassing queue for UI-triggered updates)
    await updateCloudDeviceState(deviceId, key, newState);
  };

  return {
    syncNow: syncLocalAndCloud,
    cloudDevices,
    isLoading,
    updateDeviceStateAndSync,
  };
};
