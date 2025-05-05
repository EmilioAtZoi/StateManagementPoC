import React from "react";
import { StyleSheet, Text, View, Button, TouchableOpacity } from "react-native";
import { BLEManager } from "../ble/bleManager";
import { useDeviceStore } from "../state/store";
import { useThings } from "../mocks/MockCloud";

type CardProps = {
  id: string;
  name?: string;
  type?: string;
  onDelete: (id: string) => void;
  onPress?: () => void;
};

export const Card = ({
  id,
  name = "Unknown Device",
  type = "Unknown",
  onDelete,
  onPress,
}: CardProps) => {
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
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.cardContent}>
        <View>
          <Text style={styles.title}>{name}</Text>
          <Text style={styles.subtitle}>
            {type} - {id.substring(0, 8)}
          </Text>
        </View>
        <Button
          title="X"
          onPress={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
          color="red"
        />
      </View>
      {isOnline ? (
        <Button title="Disconnect" onPress={disconnectFromDevice} />
      ) : (
        <Button title="Connect" onPress={connectToDevice} />
      )}
    </TouchableOpacity>
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
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
});
