import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DeviceControlScreen } from "./screens/DeviceControlScreen";
import { RootStackParamList } from "./screens/types";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Button, FlatList, Text } from "react-native";
import { Card } from "./components/Card";
import { AddDevice } from "./components/AddDevice";
import { useThings } from "./mocks/MockCloud";
import { BLEManager } from "./ble/bleManager";
import { BLEEventHandler } from "./eventHandlers/bleEventHandler";

// Create a simple Home screen
const HomeScreen = ({ navigation }: any) => {
  const { things, thingsCount, registerThing, deleteThing, deleteAllThings } =
    useThings();
  const [isVisible, setIsVisible] = React.useState(false);

  const handleRegistration = async (deviceType: string, deviceName: string) => {
    await registerThing(deviceType, deviceName);
    setIsVisible(false);
  };

  const navigateToDeviceControl = (item: any) => {
    navigation.navigate("DeviceControl", {
      deviceId: item.id,
      deviceName: item.name,
      deviceType: item.deviceType,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Device Management</Text>
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
          <Card
            id={item.id}
            name={item.name}
            type={item.deviceType}
            onDelete={deleteThing}
            onPress={() => navigateToDeviceControl(item)}
          />
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
  );
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  React.useEffect(() => {
    // Initialize BLEManager and BLEEventHandler
    BLEManager.initialize();
    BLEEventHandler.initialize();

    return () => {
      // Cleanup BLEEventHandler
      BLEEventHandler.cleanup();
    };
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "Devices" }}
        />
        <Stack.Screen
          name="DeviceControl"
          component={DeviceControlScreen}
          options={({ route }) => ({
            title: `${route.params.deviceName} Control`,
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  inlineButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 16,
  },
});
