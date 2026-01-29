import { google } from 'googleapis';
import { Readable } from 'stream';

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

/**
 * Authenticates with Google using Service Account credentials
 */
const getDriveService = () => {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('Missing Google Drive credentials. Please check GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY environment variables.');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: SCOPES,
  });

  return google.drive({ version: 'v3', auth });
};

/**
 * Fetches a file stream from Google Drive
 * @param fileId The Google Drive File ID
 * @returns Readable stream of the file
 */
export const getFileStream = async (fileId: string): Promise<Readable> => {
  const drive = getDriveService();
  
  try {
    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );
    
    return response.data as Readable;
  } catch (error) {
    console.error('Error fetching file from Drive:', error);
    throw error;
  }
};

/**
 * Fetches file metadata (name, mimeType, size)
 */
export const getFileMetadata = async (fileId: string) => {
  const drive = getDriveService();
  
  try {
    const response = await drive.files.get({
      fileId,
      fields: 'id, name, mimeType, size',
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching metadata from Drive:', error);
    throw error;
  }
};
