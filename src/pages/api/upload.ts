import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadDir = path.join(process.cwd(), '/public/uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 50 * 1024 * 1024,
    filename: (name, ext, part, form) => {
      const uuid = uuidv4();
      const extension = path.extname(part.originalFilename || '');
      return `${uuid}${extension}`;
    }
  });

  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(500).json({ message: 'Upload failed' });
    }

    const uploadedFiles = Object.values(files).flat().map((f: any) => ({
      originalFilename: f.originalFilename,
      storedFilename: path.basename(f.filepath),
      path: f.filepath,
    }));

    res.status(200).json({ message: 'Upload successful', files: uploadedFiles });
  });
}