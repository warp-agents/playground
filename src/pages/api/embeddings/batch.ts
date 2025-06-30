import {
    AutoProcessor,
    CLIPVisionModelWithProjection,
    RawImage
} from '@huggingface/transformers';
import { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
import { TileData } from '@/lib/types';
import { createCollection, storeEmbeddings, deleteAllCollections } from '@/lib/dbs/qdrant';
  
const MODEL_ID = "Xenova/clip-vit-base-patch16";

let processor: any = null;
let visionModel: any = null;
let modelsLoaded = false;

async function initModels() {
    if (modelsLoaded) return;

    const start = Date.now();

    try {
        const [
        loadedProcessor,
        loadedVisionModel
        ] = await Promise.all([
        AutoProcessor.from_pretrained(MODEL_ID, {}),
        CLIPVisionModelWithProjection.from_pretrained(MODEL_ID)
        ]);
        
        processor = loadedProcessor;
        visionModel = loadedVisionModel;
        
        modelsLoaded = true;
        console.log(`Models loaded in ${Date.now() - start}ms`);
    } catch (error) {
        console.error('Failed to load models:', error);
        throw error;
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await initModels();
        await deleteAllCollections() // REMOVE
        
        const { tiles } = req.body;
        
        if (!Array.isArray(tiles) || tiles.length === 0) {
            return res.status(400).json({ 
            error: 'Satellite imagery tiles are required'
            });
        }
        
        const embeddings: any[] = [];
        const errors: any[] = [];
        
        const batchSize = 5;
        for (let i = 0; i < tiles.length; i += batchSize) {
        const batch = tiles.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (tile, index) => {
            try {
            const image = await RawImage.read(tile.url);
            const imageInputs = await processor(image);
            const { image_embeds } = await visionModel(imageInputs);
            const embedding = Array.from(image_embeds.data).slice(0, image_embeds.dims[1]);
            
            return {
                success: true,
                data: {
                    ...tile,
                    embedding: embedding,
                }
            };
            } catch (error) {
                return {
                    success: false,
                    url: tile.url,
                    error: error instanceof Error ? error.message : String(error),
                }
            }
        });
        
        const batchResults = await Promise.all(batchPromises);
        
        batchResults.forEach(result => {
            if (result.success) {
                embeddings.push(result.data);
            } else {
                errors.push({ url: result.url, error: result.error });
            }
        });
        }

        const id = uuidv4();
        
        await createCollection(id)
        await storeEmbeddings(id, embeddings as TileData[])

        return res.status(200).json({
            id,
            size: embeddings.length
        });
        
    } catch (error) {
        return res.status(500).json({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error) 
        });
    }
}
