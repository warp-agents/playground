import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { filename } = req.query;
  
  if (!filename || typeof filename !== 'string') {
    return res.status(400).json({ message: 'Filename is required' });
  }

  const uploadDir = path.join(process.cwd(), '/public/uploads');
  const filePath = path.join(uploadDir, filename);

  const normalizedFilePath = path.normalize(filePath);
  if (!normalizedFilePath.startsWith(uploadDir)) {
    return res.status(400).json({ message: 'Invalid filename' });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }

  try {
    fs.unlinkSync(filePath);
    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Failed to delete file' });
  }
}