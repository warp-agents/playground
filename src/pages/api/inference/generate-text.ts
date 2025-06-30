import {
    AutoTokenizer,
    AutoModelForSeq2SeqLM 
} from '@huggingface/transformers';
import { NextApiRequest, NextApiResponse } from 'next';

const MODEL_ID = "Xenova/flan-t5-base";

let tokenizer: any = null;
let model: any = null;
let modelsLoaded = false;

async function initModels() {
    if (modelsLoaded) return;

    const start = Date.now();

    try {
        const [
            loadedTokenizer,
            loadedModel
        ] = await Promise.all([
            AutoTokenizer.from_pretrained(MODEL_ID),
            AutoModelForSeq2SeqLM.from_pretrained(MODEL_ID)
        ]);
        
        tokenizer = loadedTokenizer;
        model = loadedModel;
        
        modelsLoaded = true;
        console.log(`Text models loaded in ${Date.now() - start}ms`);
    } catch (error) {
        console.error('Failed to load text models:', error);
        throw error;
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        if(!modelsLoaded) await initModels();
        
        const { prompt } = req.body;
        
        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ 
                error: 'A string "prompt" is required in the request body'
            });
        }
        
        const inputs = tokenizer(prompt, {
            return_tensors: "pt"
        });

        const outputs = await model.generate({
            ...inputs,
            max_new_tokens: 512,
        });

        const generatedText = tokenizer.decode(outputs[0], {
            skip_special_tokens: true
        });

        return res.status(200).json({
            prompt: prompt,
            generated_text: generatedText
        });
        
    } catch (error) {
        console.error('Error in text generation handler:', error);
        return res.status(500).json({ 
            error: 'Internal server error', 
            details: error instanceof Error ? error.message : String(error) 
        });
    }
}