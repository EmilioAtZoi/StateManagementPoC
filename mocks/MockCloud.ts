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

export type ThingData = {
  id: string;
  deviceType: string;
  partNumber: string;
  name: string;
  state?: State;
  createdAt: number;
};

// File utilities
export const ensureCloudFileExists = async (): Promise<boolean> => {
  try {
    const fileExists = await FileSystem.getInfoAsync(CLOUD_FILE_PATH);
    if (!fileExists.exists) {
      await FileSystem.writeAsStringAsync(CLOUD_FILE_PATH, JSON.stringify([]));
    }
    return true;
  } catch (error) {
    console.error("Error ensuring cloud file exists:", error);
    return false;
  }
};

export const readCloudData = async (): Promise<ThingData[]> => {
  try {
    await ensureCloudFileExists();
    const data = await FileSystem.readAsStringAsync(CLOUD_FILE_PATH);
    return JSON.parse(data) as ThingData[];
  } catch (error) {
    console.error("Error reading cloud data:", error);
    return [];
  }
};

export const writeCloudData = async (things: ThingData[]): Promise<boolean> => {
  try {
    await FileSystem.writeAsStringAsync(
      CLOUD_FILE_PATH,
      JSON.stringify(things)
    );
    return true;
  } catch (error) {
    console.error("Error writing cloud data:", error);
    return false;
  }
};

// Fetch things from cloud storage
export const fetchThings = async (): Promise<{
  things: ThingData[];
  thingsCount: Record<string, number>;
}> => {
  try {
    const thingsData = await readCloudData();

    // Calculate counts
    const count = thingsData.reduce((acc: any, thing: ThingData) => {
      acc[thing.deviceType] = (acc[thing.deviceType] || 0) + 1;
      return acc;
    }, {});

    return {
      things: thingsData,
      thingsCount: { ...count, total: thingsData.length },
    };
  } catch (error) {
    console.error("Error fetching things:", error);
    return { things: [], thingsCount: { total: 0 } };
  }
};

export const updateThing = async (thingId: string, state: State) => {
  try {
    const things = await readCloudData();

    const updatedThings = things.map((thing) =>
      thing.id === thingId ? { ...thing, state } : thing
    );

    await writeCloudData(updatedThings);
    return true;
  } catch (error) {
    console.error("Error updating thing:", error);
    return false;
  }
};

// Get a specific thing by ID
export const getThing = async (
  thingId: string
): Promise<ThingData | undefined> => {
  try {
    const things = await readCloudData();
    return things.find((thing) => thing.id === thingId);
  } catch (error) {
    console.error("Error getting thing:", error);
    return undefined;
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
  const [thingsCount, setThingsCount] = React.useState<Record<string, number>>(
    {}
  );

  // Load things from the file on initialization
  React.useEffect(() => {
    const loadThings = async () => {
      try {
        setIsLoading(true);
        const result = await fetchThings();
        setThings(result.things);
        setThingsCount(result.thingsCount);
      } catch (error) {
        setError(error as Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThings();
  }, []);

  // Save things to the file whenever they are updated
  const saveThingsToFile = async (updatedThings: ThingData[]) => {
    try {
      setThings(updatedThings); // Update the state
      await writeCloudData(updatedThings);

      // Update counts
      const result = await fetchThings();
      setThingsCount(result.thingsCount);
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
    const result = await fetchThings(); // Refresh the local state
    setThings(result.things);
    setThingsCount(result.thingsCount);
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
      setThingsCount({ total: 0 });
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
