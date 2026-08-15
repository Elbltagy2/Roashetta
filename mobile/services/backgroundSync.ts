import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as SecureStore from 'expo-secure-store';
import { loadServerUrl, makeClient } from './api';
import { runSyncIfDue } from './syncService';

const TASK = 'roashetta-background-sync';
// Requested cadence. This is a floor, not a schedule: Android WorkManager
// enforces a 15 min minimum and batches through Doze, and iOS BGTaskScheduler
// picks its own windows based on usage. Treat 30 min as "as soon as the OS
// allows after 30 min", with the foreground/reconnect triggers in App.tsx
// covering the gap when the system defers us.
const INTERVAL_SECONDS = 60 * 30; // 30 minutes

// Guard defineTask — runs at import time; a native init failure here must NOT
// crash the whole app at boot.
try {
  TaskManager.defineTask(TASK, async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return BackgroundFetch.BackgroundFetchResult.NoData;

      await loadServerUrl();

      // Quick reachability check — if server is not on the network, this throws
      const client = makeClient(token);
      await client.get('/patients', { timeout: 5000 } as any);

      const result = await runSyncIfDue(token);
      return result === 'synced'
        ? BackgroundFetch.BackgroundFetchResult.NewData
        : BackgroundFetch.BackgroundFetchResult.NoData;
    } catch {
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });
} catch {
  // TaskManager native module unavailable — background sync disabled, app still runs
}

export async function registerBackgroundSync(): Promise<void> {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    if (
      status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
      status === BackgroundFetch.BackgroundFetchStatus.Denied
    ) return;

    const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(TASK, {
        minimumInterval: INTERVAL_SECONDS,
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
  } catch {
    // Background fetch not supported on this device/OS version
  }
}

export async function unregisterBackgroundSync(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK);
    if (isRegistered) await BackgroundFetch.unregisterTaskAsync(TASK);
  } catch {}
}
