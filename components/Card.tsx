import React from "react";
import { StyleSheet, Text, View, Button } from "react-native";
import { BLEManager } from "../bleManager";
import { useDeviceStore } from "../state/store";
import { useThings } from "../mocks/MockCloud";

export const Card = ({
  id,
  onDelete,
}: {
  id: string;
  onDelete: (id: string) => unknown;
}) => {
  const { things } = useThings();
  const thing = things.find((thing) => thing.id === id);
  const { devices } = useDeviceStore();
  const device = devices[id];
  const isOnline = device?.state?.online?.value;

  const connectToDevice = async () => {
    console.log(`Connecting to ${thing?.name}...`);
    await BLEManager.connectToDevice(id);
  };

  const disconnectFromDevice = async () => {
    console.log(`Disconnecting from ${thing?.name}...`);
    await BLEManager.disconnectFromDevice(id);
  };

  return (
    <View style={styles.card}>
      <View style={styles.contentWrapper}>
        <View>
          <Text>{thing?.name}</Text>
          <Text>Device Type: {thing?.deviceType}</Text>
          <Text>Part Number: {thing?.partNumber}</Text>
        </View>
        <View style={styles.deleteButtonWrapper}>
          <Button title="X" onPress={() => onDelete(id)} color="black" />
        </View>
      </View>
      {isOnline ? (
        <Button title="Disconnect" onPress={disconnectFromDevice} />
      ) : (
        <Button title="Connect" onPress={connectToDevice} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    margin: 8,
  },
  deleteButtonWrapper: {
    width: 40,
    height: 40,
    backgroundColor: "black",
    color: "white",
    padding: 2,
    borderRadius: 8,
  },
  contentWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
});
