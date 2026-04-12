import { pipeline } from '@xenova/transformers';

let extractor;

// Load model once (VERY IMPORTANT)
const loadModel = async () => {
  if (!extractor) {
    extractor = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
  }
};

// Generate embedding
export const generateEmbedding = async (text) => {
  await loadModel();

  const output = await extractor(text, {
    pooling: 'mean',
    normalize: true,
  });

  return Array.from(output.data);
};