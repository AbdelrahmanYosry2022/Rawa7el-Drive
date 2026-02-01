// TODO: googleapis not available in browser environment - this module is server-side only
// Original implementation commented out for Vite browser build

/**
 * Stub: Fetches a file stream from Google Drive
 * This functionality requires server-side implementation
 */
export const getFileStream = async (_fileId: string): Promise<ReadableStream> => {
  console.warn('getFileStream: googleapis not available in browser environment');
  throw new Error('Google Drive integration requires server-side implementation');
};

/**
 * Stub: Fetches file metadata (name, mimeType, size)
 * This functionality requires server-side implementation
 */
export const getFileMetadata = async (_fileId: string) => {
  console.warn('getFileMetadata: googleapis not available in browser environment');
  throw new Error('Google Drive integration requires server-side implementation');
};
