import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Button } from "react-native";
import { RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useDeviceStore } from "../state/store";
import { BLEManager } from "../ble/bleManager";
import { RootStackParamList } from "./types";

type DeviceControlScreenProps = {
  route: RouteProp<RootStackParamList, "DeviceControl">;
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

enum PressureLevel {
  low = 1,
  medium = 2,
  high = 3,
}

export const DeviceControlScreen = ({
  route,
  navigation,
}: DeviceControlScreenProps) => {
  // Get device info from route params
  const { deviceId, deviceName, deviceType } = route.params;

  const { devices } = useDeviceStore();
  const device = devices[deviceId];

  // Track connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Get the current pressure level from the store or set a default
  const currentPressureLevel =
    (device?.state?.pressureLevel?.value as PressureLevel) ||
    PressureLevel.medium;
  const [pressureLevel, setPressureLevel] =
    useState<PressureLevel>(currentPressureLevel);

  // Update local UI when the device's pressure level changes in the store
  useEffect(() => {
    if (device?.state?.pressureLevel?.value) {
      setPressureLevel(device.state.pressureLevel.value as PressureLevel);
    }
  }, [device?.state?.pressureLevel]);

  // Set navigation title
  useEffect(() => {
    navigation.setOptions({
      title: `${deviceName} Control`,
    });
  }, [navigation, deviceName]);

  // Check connection status when component mounts
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Get connection status from device state
        const isOnline = device?.state?.online?.value === true;
        setIsConnected(isOnline);
      } catch (error) {
        console.error("Error checking connection status:", error);
        setIsConnected(false);
      }
    };
    checkConnection();
  }, [deviceId, device?.state?.online?.value]);

  // Function to connect to the device
  const connectToDevice = async () => {
    try {
      setIsConnecting(true);
      // Attempt to connect using BLEManager
      await BLEManager.connectToDevice(deviceId);
      // The connection state will be updated via the store when the BLE event is emitted
    } catch (error) {
      console.error("Error connecting to device:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Check if device is K5 or K7 (those that support pressure levels)
  const supportsPressure = deviceType === "K5EU" || deviceType === "K7EU";

  // Update pressure level - ONLY update the BLE device, not the store
  const changePressureLevel = async (level: PressureLevel) => {
    try {
      // Don't allow changes if the device isn't connected
      if (!isConnected) {
        console.warn("Cannot change pressure: device not connected");
        return;
      }

      // Skip if same level (no change needed)
      if (level === pressureLevel) {
        console.log("Pressure level already set to", level);
        return;
      }

      // The BLEManager.setPressureLevel will emit an event that updates the store
      await BLEManager.setPressureLevel(deviceId, level);

      console.log(`Pressure level change requested: ${level}`);
    } catch (error) {
      console.error("Error changing pressure level:", error);
    }
  };

  if (!supportsPressure) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Device Settings</Text>
        <Text style={styles.notSupported}>
          Pressure control is not supported on {deviceType} devices.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pressure Control</Text>

      {/* Connection status indicator */}
      <View style={styles.connectionStatus}>
        <View
          style={[
            styles.connectionDot,
            isConnected ? styles.connectedDot : styles.disconnectedDot,
          ]}
        />
        <Text
          style={isConnected ? styles.connectedText : styles.disconnectedText}
        >
          {isConnected ? "Connected" : "Disconnected"}
        </Text>

        {/* Show connect button only when device is not connected */}
        {!isConnected && (
          <Button
            title={isConnecting ? "Connecting..." : "Connect Device"}
            onPress={connectToDevice}
            disabled={isConnecting}
          />
        )}
      </View>

      {/* Only show controls if device is connected */}
      {isConnected ? (
        <>
          <Text style={styles.subtitle}>Select pressure level:</Text>

          <View style={styles.verticalOptionsContainer}>
            {/* High pressure option - widest */}
            <TouchableOpacity
              style={[
                styles.option,
                styles.highOption,
                pressureLevel === PressureLevel.high && styles.selectedOption,
              ]}
              onPress={() => changePressureLevel(PressureLevel.high)}
              disabled={pressureLevel === PressureLevel.high}
            >
              <Text style={styles.optionText}>High</Text>
            </TouchableOpacity>

            {/* Medium pressure option - medium width */}
            <TouchableOpacity
              style={[
                styles.option,
                styles.mediumOption,
                pressureLevel === PressureLevel.medium && styles.selectedOption,
              ]}
              onPress={() => changePressureLevel(PressureLevel.medium)}
              disabled={pressureLevel === PressureLevel.medium}
            >
              <Text style={styles.optionText}>Medium</Text>
            </TouchableOpacity>

            {/* Low pressure option - narrowest */}
            <TouchableOpacity
              style={[
                styles.option,
                styles.lowOption,
                pressureLevel === PressureLevel.low && styles.selectedOption,
              ]}
              onPress={() => changePressureLevel(PressureLevel.low)}
              disabled={pressureLevel === PressureLevel.low}
            >
              <Text style={styles.optionText}>Low</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.currentStatus}>
            Current Pressure:{" "}
            {PressureLevel[pressureLevel].charAt(0).toUpperCase() +
              PressureLevel[pressureLevel].slice(1)}
          </Text>
        </>
      ) : (
        <View style={styles.notConnectedMessage}>
          <Text style={styles.notConnectedText}>
            Connect to the device to control pressure settings.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    marginTop: 20,
    marginBottom: 15,
  },
  // Vertical container for options
  verticalOptionsContainer: {
    alignItems: "center",
    marginVertical: 20,
    width: "100%",
  },
  // Base option style
  option: {
    backgroundColor: "#eaeaea",
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  // Inverted cone design - high pressure is widest
  highOption: {
    width: "90%",
    height: 60,
  },
  mediumOption: {
    width: "70%",
    height: 60,
  },
  lowOption: {
    width: "50%",
    height: 60,
  },
  selectedOption: {
    backgroundColor: "#007bff",
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
  },
  currentStatus: {
    fontSize: 18,
    marginTop: 20,
    textAlign: "center",
  },
  notSupported: {
    fontSize: 16,
    color: "#666",
    marginTop: 20,
  },
  // Connection status styles
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    flexWrap: "wrap",
  },
  connectionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  connectedDot: {
    backgroundColor: "#4CAF50", // Green
  },
  disconnectedDot: {
    backgroundColor: "#F44336", // Red
  },
  connectedText: {
    color: "#4CAF50",
    fontWeight: "500",
    marginRight: 20,
  },
  disconnectedText: {
    color: "#F44336",
    fontWeight: "500",
    marginRight: 20,
  },
  notConnectedMessage: {
    marginTop: 30,
    padding: 20,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    alignItems: "center",
  },
  notConnectedText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});
