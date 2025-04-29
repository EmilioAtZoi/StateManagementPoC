import { updateCloudDeviceState } from "../services/syncService";
import { useDeviceStore } from "./store";

type QueueItem = {
  type: string; // Action type (e.g., "ADD_DEVICE", "UPDATE_DEVICE_STATE")
  payload: Record<string, any>; // Data associated with the action
};

class QueueSystem {
  private static queue: QueueItem[] = [];
  private static isProcessing = false;

  // Push a new item to the queue
  static push(item: QueueItem) {
    console.log(`QueueSystem: Adding item to queue`, item);
    this.queue.push(item);
    this.processQueue(); // Start processing the queue
  }

  // Process the queue sequentially
  private static async processQueue() {
    if (this.isProcessing) return; // Avoid concurrent processing
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const currentItem = this.queue.shift(); // Get the first item in the queue
      if (currentItem) {
        try {
          console.log(`QueueSystem: Processing item`, currentItem);
          await this.handleItem(currentItem); // Process the item
        } catch (error) {
          console.error(
            `QueueSystem: Error processing item`,
            currentItem,
            error
          );
        }
      }
    }

    this.isProcessing = false;
  }

  // Handle individual queue items
  private static async handleItem(item: QueueItem) {
    switch (item.type) {
      case "UPDATE_DEVICE_STATE":
        if (
          "id" in item.payload &&
          "key" in item.payload &&
          "record" in item.payload &&
          typeof item.payload.id === "string" &&
          typeof item.payload.key === "string" &&
          item.payload.record &&
          typeof item.payload.record.value !== "undefined"
        ) {
          await this.syncUpdateDeviceState(
            item.payload as {
              id: string;
              key: string;
              record: any;
            }
          );
        } else {
          console.error(
            `QueueSystem: Invalid payload for UPDATE_DEVICE_STATE`,
            item.payload
          );
        }
        break;
      default:
        console.warn(`QueueSystem: Unknown action type "${item.type}"`);
    }
  }

  // Sync an updated device state with the cloud
  private static async syncUpdateDeviceState(payload: {
    id: string;
    key: string;
    record: any;
  }) {
    console.log(
      `QueueSystem: Syncing updated state for device with ID ${payload.id}, key "${payload.key}"`
    );
    try {
      // Get the store's update function directly
      const updateDeviceState = useDeviceStore.getState().updateDeviceState;

      // Use cloud sync with ability to update local state if cloud is newer
      await updateCloudDeviceState(
        payload.id,
        payload.key,
        payload.record,
        updateDeviceState // Pass the store's update function
      );

      console.log(
        `QueueSystem: State for device with ID ${payload.id} synced successfully`
      );
    } catch (error) {
      console.error(
        `QueueSystem: Failed to sync state for device with ID ${payload.id}`,
        error
      );
    }
  }
}

export { QueueSystem };
