import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Button, FlatList } from "react-native";
import React, { useEffect } from "react";
import { Card } from "./components/Card";
import { AddDevice } from "./components/AddDevice";
import { useThings } from "./mocks/MockCloud";
import { BLEManager } from "./ble/bleManager";
import { BLEEventHandler } from "./eventHandlers/bleEventHandler";

export default function App() {
  const [isVisible, setIsVisible] = React.useState(false);

  const { things, thingsCount, registerThing, deleteThing, deleteAllThings } =
    useThings();

  const handleRegistration = async (deviceType: string, deviceName: string) => {
    await registerThing(deviceType, deviceName);
    setIsVisible(false);
  };

  useEffect(() => {
    // Initialize BLEManager and BLEEventHandler
    BLEManager.initialize();
    BLEEventHandler.initialize();

    return () => {
      // Cleanup BLEEventHandler
      BLEEventHandler.cleanup();
    };
  }, []);

  return (
    <>
      <View style={styles.container}>
        <Button title="Add device" onPress={() => setIsVisible(true)} />
        <FlatList
          data={things}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card id={item.id} onDelete={deleteThing} />
          )}
          style={{ width: "100%" }}
        />
        <Button
          title="Delete all devices"
          onPress={deleteAllThings}
          color="red"
          disabled={things.length === 0}
        />
        <StatusBar style="auto" />
      </View>
      <AddDevice
        visible={isVisible}
        count={thingsCount}
        onCancel={() => setIsVisible(false)}
        onAddDevice={handleRegistration}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    marginTop: 50,
  },
});
