import React from "react";
import * as FileSystem from "expo-file-system";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid"; // Import UUID library

const CLOUD_FILE_PATH = `${FileSystem.documentDirectory}cloud.json`;

export type State = {
  [key: string]: {
    value: boolean | string | number | any[] | Record<string, any>;
    lastUpdate: number;
  };
};

type ThingData = {
  id: string;
  deviceType: string;
  partNumber: string;
  name: string;
  state?: State;
  createdAt: number;
};

export const updateThing = async (thingId: string, state: State) => {
  try {
    const fileExists = await FileSystem.getInfoAsync(CLOUD_FILE_PATH);
    if (!fileExists.exists) {
      console.error("Cloud file does not exist.");
      return;
    }

    const data = await FileSystem.readAsStringAsync(CLOUD_FILE_PATH);
    const things: ThingData[] = JSON.parse(data);

    const updatedThings = things.map((thing) =>
      thing.id === thingId ? { ...thing, state } : thing
    );

    await FileSystem.writeAsStringAsync(
      CLOUD_FILE_PATH,
      JSON.stringify(updatedThings)
    );
  } catch (error) {
    console.error("Error updating thing:", error);
  }
};

export const useThings = (): {
  things: ThingData[];
  isLoading: boolean;
  error: Error | null;
  thingsCount: Record<string, number>;
  registerThing: (deviceType: string, deviceName: string) => Promise<void>;
  updateThing: (thingId: string, state: State) => Promise<void>;
  deleteThing: (thingId: string) => Promise<void>;
  deleteAllThings: () => Promise<void>;
} => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [things, setThings] = React.useState<ThingData[]>([]);
  const [thingsCount, setThingsCount] = React.useState({});

  const fetchThings = async () => {
    try {
      setIsLoading(true);
      const fileExists = await FileSystem.getInfoAsync(CLOUD_FILE_PATH);
      if (!fileExists.exists) {
        await FileSystem.writeAsStringAsync(
          CLOUD_FILE_PATH,
          JSON.stringify([])
        );
        setThings([]);
      } else {
        const data = await FileSystem.readAsStringAsync(CLOUD_FILE_PATH);
        const thingsData = JSON.parse(data);
        setThings(thingsData);
        const count = thingsData.reduce((acc: any, thing: ThingData) => {
          acc[thing.deviceType] = (acc[thing.deviceType] || 0) + 1;
          return acc;
        }, {});
        setThingsCount({ ...count, total: thingsData.length });
      }
    } catch (error) {
      setError(error as Error);
      console.error("Error fetching things:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load things from the file on initialization
  React.useEffect(() => {
    fetchThings();
  }, []);

  // Save things to the file whenever they are updated
  const saveThingsToFile = async (updatedThings: ThingData[]) => {
    try {
      setThings(updatedThings); // Update the state
      await FileSystem.writeAsStringAsync(
        CLOUD_FILE_PATH,
        JSON.stringify(updatedThings)
      );
      fetchThings(); // Re-fetch things to update the count
    } catch (error) {
      console.error("Error saving things to file:", error);
    }
  };

  const registerThing = async (deviceType: string, deviceName: string) => {
    try {
      const count = thingsCount[deviceType as keyof typeof thingsCount] || 0;
      const nextDeviceNum = count + 1;
      const partNumber = `1.234-567.${nextDeviceNum.toString()}`;
      const thingId = uuidv4(); // Generate a UUID for the thingId

      const newThing: ThingData = {
        id: thingId,
        deviceType,
        name: `${deviceName}`,
        partNumber,
        state: undefined,
        createdAt: Date.now(),
      };

      const updatedThings = [...things, newThing];
      await saveThingsToFile(updatedThings); // Persist to file and update state
    } catch (error) {
      console.error("Error registering thing:", error);
    }
  };

  const updateThingInHook = async (thingId: string, state: State) => {
    await updateThing(thingId, state); // Reuse the independent function
    fetchThings(); // Refresh the local state
  };

  const deleteThing = async (thingId: string) => {
    try {
      const updatedThings = things.filter((thing) => thing.id !== thingId);
      await saveThingsToFile(updatedThings); // Persist to file and update state
    } catch (error) {
      console.error("Error deleting thing:", error);
    }
  };

  const deleteAllThings = async () => {
    try {
      await FileSystem.deleteAsync(CLOUD_FILE_PATH);
      setThings([]); // Clear the state
    } catch (error) {
      console.error("Error deleting all things:", error);
    }
  };

  return {
    things,
    isLoading,
    error,
    thingsCount,
    registerThing,
    updateThing: updateThingInHook, // Expose the hook-specific version
    deleteThing,
    deleteAllThings,
  };
};
