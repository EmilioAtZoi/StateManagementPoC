import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

const deviceTypes = ["FC8", "K7EU", "K5EU"];

interface AddDeviceProps {
  visible: boolean;
  count: Record<string, number>;
  onCancel: () => void;
  onAddDevice: (deviceType: string, deviceName: string) => void;
}

export const AddDevice = ({
  visible,
  count,
  onCancel,
  onAddDevice,
}: AddDeviceProps) => {
  const [selectedDeviceType, setSelectedDeviceType] = useState(deviceTypes[0]);
  const [deviceName, setDeviceName] = useState("");

  // Update the device count and name when the modal becomes visible or the device type changes
  React.useEffect(() => {
    if (visible) {
      const updatedCount = count[selectedDeviceType] || 0;
      setDeviceName(`My ${selectedDeviceType} ${updatedCount + 1}`);
    }
  }, [visible, selectedDeviceType, count]);

  const handleDeviceTypeChange = (type: string) => {
    setSelectedDeviceType(type);
    const updatedCount = count[type] || 0;
    setDeviceName(`My ${type} ${updatedCount + 1}`);
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Add Device</Text>
          <Text>Device Type:</Text>
          <View style={styles.radioGroup}>
            {deviceTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.radioButton}
                onPress={() => handleDeviceTypeChange(type)}
              >
                <View
                  style={[
                    styles.radioCircle,
                    selectedDeviceType === type && styles.radioSelected,
                  ]}
                />
                <Text style={styles.radioLabel}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text>Device Name:</Text>
          <TextInput
            style={styles.input}
            value={deviceName}
            onChangeText={setDeviceName}
          />
          <View style={styles.buttonContainer}>
            <Button title="Cancel" onPress={handleCancel} />
            <Button
              title="Add Device"
              onPress={() => onAddDevice(selectedDeviceType, deviceName)}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  radioGroup: {
    flexDirection: "row",
    marginBottom: 10,
  },
  radioButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 5,
  },
  radioSelected: {
    backgroundColor: "#000",
  },
  radioLabel: {
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 8,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
