import {
AutoProcessor,
CLIPVisionModelWithProjection,
RawImage,
AutoTokenizer,
CLIPTextModelWithProjection
} from '@huggingface/transformers';
import { NextApiRequest, NextApiResponse } from 'next';
import { calculateCosineSimilarity } from '@/lib/similarity';
import { fetchAllEmbeddings, deleteCollection } from '@/lib/dbs/qdrant';

const MODEL_ID = "Xenova/clip-vit-base-patch16";

let processor: any = null;
let visionModel: any = null;
let tokenizer: any = null;
let textModel: any = null;
let modelsLoaded = false;

async function initModels() {
    if (modelsLoaded) return;

    console.log('Loading CLIP models...');
    const start = Date.now();

    try {
        const [
        loadedProcessor,
        loadedVisionModel,
        loadedTokenizer,
        loadedTextModel
        ] = await Promise.all([
        AutoProcessor.from_pretrained(MODEL_ID, {}),
        CLIPVisionModelWithProjection.from_pretrained(MODEL_ID),
        AutoTokenizer.from_pretrained(MODEL_ID),
        CLIPTextModelWithProjection.from_pretrained(MODEL_ID)
        ]);
        
        processor = loadedProcessor;
        visionModel = loadedVisionModel;
        tokenizer = loadedTokenizer;
        textModel = loadedTextModel;
        
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
        const { text, imageUrl, id, size } = req.body;
        const dataset = await fetchAllEmbeddings(id, size);
        
        if (!text && !imageUrl) {
            return res.status(400).json({ error: "Text or image is required" });
        }
        
        if (!dataset || !Array.isArray(dataset)) {
            return res.status(400).json({ error: "Dataset is required" });
        }

        let textEmbedding = null;
        let imageEmbedding = null;

        await initModels();
        
        if (text) {
            const textInputs = tokenizer([text], { padding: true, truncation: true });
            const { text_embeds } = await textModel(textInputs);
            textEmbedding = Array.from(text_embeds.data).slice(0, text_embeds.dims[1]);
        }
        
        if (imageUrl) {
            const image = await RawImage.read(imageUrl);
            const imageInputs = await processor(image);
            const { image_embeds } = await visionModel(imageInputs);
            imageEmbedding = Array.from(image_embeds.data).slice(0, image_embeds.dims[1]);
        }
        
        let embedding;
        if (textEmbedding && imageEmbedding) {
            embedding = [...imageEmbedding, ...textEmbedding];
        } else if (textEmbedding) {
            embedding = textEmbedding;
        } else if (imageEmbedding) {
            embedding = imageEmbedding;
        } else {
            return res.status(500).json({ error: "Failed to generate embeddings" });
        }

        const results = dataset
        .filter((tile) => tile.embedding && Array.isArray(tile.embedding))
        .map(({ embedding, ...rest }) => ({
            ...rest,
            similarity: calculateCosineSimilarity(
            new Float32Array(embedding as number[]),
            new Float32Array(embedding as number[])
            )
        }))
        .sort((a, b) => b.similarity - a.similarity);

        await deleteCollection(id)

        return res.status(200).json({ results });
        
    } catch (error) {
        return res.status(500).json({ 
            error: "Error processing embeddings",
            details: error instanceof Error ? error.message : String(error)
        });    
    }
}