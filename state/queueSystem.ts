import { updateCloudDeviceState } from "../services/syncService";
import { useDeviceStore } from "./store";

type QueueItem = {
  type: string;
  payload: Record<string, any>;
  retryCount?: number; // Number of retry attempts
  nextRetryTime?: number; // Timestamp for next retry attempt
};

class QueueSystem {
  private static queue: QueueItem[] = [];
  private static isProcessing = false;
  private static MAX_RETRIES = 5; // Maximum number of retry attempts
  private static BASE_DELAY = 2000; // Base delay in milliseconds (2 seconds)
  private static retryTimeouts: NodeJS.Timeout[] = []; // Store timeout IDs for cleanup

  // Push a new item to the queue
  static push(item: QueueItem) {
    console.log(`QueueSystem: Adding item to queue`, item);
    // Initialize retry properties if not set
    if (item.retryCount === undefined) {
      item.retryCount = 0;
    }
    this.queue.push(item);
    this.processQueue(); // Start processing the queue
  }

  // Process the queue sequentially
  private static async processQueue() {
    if (this.isProcessing) return; // Avoid concurrent processing
    this.isProcessing = true;

    const now = Date.now();
    const itemsToProcess = this.queue.filter(
      (item) => !item.nextRetryTime || item.nextRetryTime <= now
    );

    // Filter out items that are not ready for retry yet
    this.queue = this.queue.filter(
      (item) => item.nextRetryTime && item.nextRetryTime > now
    );

    for (const item of itemsToProcess) {
      try {
        console.log(`QueueSystem: Processing item`, item);
        const success = await this.handleItem(item); // Process the item

        if (
          !success &&
          item.retryCount !== undefined &&
          item.retryCount < this.MAX_RETRIES
        ) {
          // If processing failed and we haven't exceeded max retries
          item.retryCount++;

          // Calculate backoff delay with exponential increase
          const backoffDelay =
            this.BASE_DELAY * Math.pow(2, item.retryCount - 1);

          // Set next retry time
          item.nextRetryTime = Date.now() + backoffDelay;

          console.log(
            `QueueSystem: Scheduling retry #${item.retryCount} for item in ${backoffDelay}ms`,
            item
          );

          // Add back to queue
          this.queue.push(item);

          // Schedule processing after the backoff delay
          const timeoutId = setTimeout(() => {
            this.processQueue();
          }, backoffDelay + 100); // Add a small buffer

          this.retryTimeouts.push(timeoutId);
        } else if (!success) {
          // Max retries exceeded or no retries set
          console.error(
            `QueueSystem: Max retries exceeded or processing failed permanently for item`,
            item
          );
        }
      } catch (error) {
        console.error(`QueueSystem: Error processing item`, item, error);
      }
    }

    this.isProcessing = false;

    // If there are remaining items in the queue that are delayed for retry,
    // schedule the next processing round
    if (this.queue.length > 0) {
      const nextRetryItem = this.queue.reduce(
        (earliest, item) => {
          if (
            item.nextRetryTime &&
            (!earliest.nextRetryTime ||
              item.nextRetryTime < earliest.nextRetryTime)
          ) {
            return item;
          }
          return earliest;
        },
        { nextRetryTime: Infinity } as QueueItem
      );

      if (
        nextRetryItem.nextRetryTime &&
        nextRetryItem.nextRetryTime !== Infinity
      ) {
        const delay = Math.max(0, nextRetryItem.nextRetryTime - Date.now());
        const timeoutId = setTimeout(() => {
          this.processQueue();
        }, delay + 100);

        this.retryTimeouts.push(timeoutId);
      }
    }
  }

  // Clean up any pending retry timeouts (useful when app is closing)
  static cleanup() {
    this.retryTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    this.retryTimeouts = [];
  }

  // Handle individual queue items - returns success/failure
  private static async handleItem(item: QueueItem): Promise<boolean> {
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
          return await this.syncUpdateDeviceState(
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
          return false; // Don't retry malformed items
        }
      default:
        console.warn(`QueueSystem: Unknown action type "${item.type}"`);
        return false; // Don't retry unknown types
    }
  }

  // Sync an updated device state with the cloud - returns success/failure
  private static async syncUpdateDeviceState(payload: {
    id: string;
    key: string;
    record: any;
  }): Promise<boolean> {
    console.log(
      `QueueSystem: Syncing updated state for device with ID ${payload.id}, key "${payload.key}"`
    );
    try {
      // Get the store's update function directly
      const updateDeviceState = useDeviceStore.getState().updateDeviceState;

      // Use cloud sync with ability to update local state if cloud is newer
      const success = await updateCloudDeviceState(
        payload.id,
        payload.key,
        payload.record,
        updateDeviceState // Pass the store's update function
      );

      if (success) {
        console.log(
          `QueueSystem: State for device with ID ${payload.id} synced successfully`
        );
      } else {
        console.warn(
          `QueueSystem: State sync returned false for device with ID ${payload.id}`
        );
      }

      return success; // Return success status from cloud update
    } catch (error) {
      console.error(
        `QueueSystem: Failed to sync state for device with ID ${payload.id}`,
        error
      );
      return false; // Return failure to trigger retry
    }
  }
}

export { QueueSystem };
