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
        <View style={styles.inlineButtons}>
          <Button
            title="Delete all"
            onPress={deleteAllThings}
            color="red"
            disabled={things.length === 0}
          />
          <Button title="Add device" onPress={() => setIsVisible(true)} />
        </View>
        <FlatList
          data={things}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card id={item.id} onDelete={deleteThing} />
          )}
          style={{ width: "100%" }}
        />
        <AddDevice
          visible={isVisible}
          onCancel={() => setIsVisible(false)}
          onAddDevice={handleRegistration}
          count={thingsCount}
        />
        <StatusBar style="auto" />
      </View>
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
  inlineButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 16,
  },
});
