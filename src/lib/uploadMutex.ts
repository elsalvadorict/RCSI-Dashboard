/**
 * Upload Mutex
 * ------------
 * A simple in-memory mutex to serialize upload operations.
 *
 * Why: SQLite serializes writes at the database level, but the application-level
 * operation (read existing → compute upserts → write) is NOT atomic. If two
 * uploads run concurrently, they can read stale data and produce inconsistent
 * results. This mutex ensures only one upload runs at a time.
 *
 * Behavior:
 * - The first upload acquires the lock and proceeds.
 * - Subsequent uploads get a 409 Conflict response with a Retry-After header.
 * - The client (UploadPanel) shows a "another upload in progress" message and
 *   auto-retries after a few seconds.
 *
 * Note: This is a single-process mutex. If the app is scaled to multiple
 * server instances, replace this with a Redis-based or database-based lock.
 */

let uploadInProgress = false;
let currentUploadInfo: { fileName: string; startedAt: number } | null = null;

export function acquireUploadLock(fileName: string): boolean {
  if (uploadInProgress) return false;
  uploadInProgress = true;
  currentUploadInfo = { fileName, startedAt: Date.now() };
  return true;
}

export function releaseUploadLock(): void {
  uploadInProgress = false;
  currentUploadInfo = null;
}

export function isUploadInProgress(): boolean {
  return uploadInProgress;
}

export function getCurrentUploadInfo(): { fileName: string; startedAt: number; elapsedMs: number } | null {
  if (!uploadInProgress || !currentUploadInfo) return null;
  return {
    fileName: currentUploadInfo.fileName,
    startedAt: currentUploadInfo.startedAt,
    elapsedMs: Date.now() - currentUploadInfo.startedAt,
  };
}
