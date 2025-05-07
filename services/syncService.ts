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
  newState: any,
  updateLocalStateFn?: (deviceId: string, key: string, state: any) => void
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
    } else if (localTimestamp < cloudTimestamp && updateLocalStateFn) {
      // Cloud state is newer, update local state
      console.log(
        `Cloud Sync: Cloud state is newer (${cloudTimestamp} > ${localTimestamp}), updating local state`
      );

      // Update the local state using the provided function
      const cloudValue = cloudState?.[key];
      if (cloudValue) {
        updateLocalStateFn(deviceId, key, cloudValue);
      }
      return true; // Success - no cloud update needed, local update done
    } else {
      console.log(
        `Cloud Sync: States have same timestamp (${cloudTimestamp} = ${localTimestamp}), no update needed`
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
              updateDeviceState(cloudDevice.id, key, cloudRecord);
            } else if (
              localRecord &&
              localRecord.lastUpdate > cloudRecord.lastUpdate
            ) {
              // Local state is newer, update cloud
              updateCloudDeviceState(cloudDevice.id, key, localRecord);
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

    // Then sync with cloud
    await updateCloudDeviceState(deviceId, key, newState, updateDeviceState);
  };

  return {
    syncNow: syncLocalAndCloud,
    cloudDevices,
    isLoading,
    updateDeviceStateAndSync,
  };
};
