import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { filenames } = req.body;
  
  if (!filenames || !Array.isArray(filenames)) {
    return res.status(400).json({ message: 'Filenames array is required' });
  }

  const uploadDir = path.join(process.cwd(), '/public/uploads');

  try {
    const results = [];
    
    for (const filename of filenames) {
      if (typeof filename !== 'string') continue;
      
      const filePath = path.join(uploadDir, filename);
      
      const normalizedFilePath = path.normalize(filePath);
      if (!normalizedFilePath.startsWith(uploadDir)) {
        results.push({ filename, deleted: false, reason: 'Invalid path' });
        continue;
      }
      
      if (!fs.existsSync(filePath)) {
        results.push({ filename, deleted: false, reason: 'File not found' });
        continue;
      }
      
      fs.unlinkSync(filePath);
      results.push({ filename, deleted: true });
    }
    
    res.status(200).json({ message: 'Files processed', results });
  } catch (error) {
    console.error('Error deleting files:', error);
    res.status(500).json({ message: 'Failed to delete files' });
  }
}