import { getAccessToken } from './firebase';

export async function uploadToDrive(file: File, folderName: string = 'TripWise_Bills'): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token available');

  // 1. Get or Create Folder
  let folderId = await findFolder(token, folderName);
  if (!folderId) {
    folderId = await createFolder(token, folderName);
  }

  // 2. Upload File
  const metadata = {
    name: `${Date.now()}_${file.name}`,
    parents: [folderId],
    mimeType: file.type,
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Drive upload failed: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  // Using the thumbnail link format with a large size for preview
  return `https://drive.google.com/thumbnail?id=${data.id}&sz=w1000`;
}

async function findFolder(token: string, name: string): Promise<string | null> {
  const q = encodeURIComponent(`name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  return data.files?.[0]?.id || null;
}

async function createFolder(token: string, name: string): Promise<string> {
  const metadata = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  };
  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });
  const data = await response.json();
  return data.id;
}
