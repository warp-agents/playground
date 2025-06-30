import { QdrantClient } from '@qdrant/js-client-rest';
import { TileData } from "@/lib/types";

export const qdrant = new QdrantClient({ 
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY, 
});

export async function createCollection(collectionName: string) {
    await qdrant.createCollection(collectionName, {
        vectors: {
            size: 512,
            distance: 'Cosine',
        },
    });
}

export async function storeEmbeddings(collectionName: string, embeddings: TileData[]) {
    const points = embeddings
    .filter(tile => Array.isArray(tile.embedding))
    .map((tile, index) => ({
        id: index,
        vector: tile.embedding as number[],
        payload: {
            url: tile.url,
            alt: tile.alt || null,
            caption: tile.caption || null,
            similarity: tile.similarity || null,
            coords_lat: tile.coords?.lat || null,
            coords_lng: tile.coords?.lng || null,
            x: tile.x,
            y: tile.y,
            zoom: tile.zoom,
            center_lat: tile.center.lat,
            center_lng: tile.center.lng,
            bounds_north: tile.bounds.north,
            bounds_south: tile.bounds.south,
            bounds_east: tile.bounds.east,
            bounds_west: tile.bounds.west,
        }
    }));

    await qdrant.upsert(collectionName, {
        points,
    });
}

export async function fetchAllEmbeddings(collectionName: string, size: number): Promise<TileData[]> {
    const allPoints: any[] = [];
    let offset: any = undefined;

    while (true) {
        const response = await qdrant.scroll(collectionName, {
            limit: 64,
            with_vector: true,
            with_payload: true,
            offset,
        });

        allPoints.push(...response.points);
        if (!response.next_page_offset) break;
        offset = response.next_page_offset;
    }

    return allPoints.slice(0, size).map((point) => {
        const p = point.payload;
        return {
            url: p.url,
            alt: p.alt ?? undefined,
            caption: p.caption ?? undefined,
            similarity: p.similarity ?? undefined,
            embedding: point.vector,
            coords: {
                lat: p.coords_lat,
                lng: p.coords_lng,
            },
            x: p.x,
            y: p.y,
            zoom: p.zoom,
            center: {
                lat: p.center_lat,
                lng: p.center_lng,
            },
            bounds: {
                north: p.bounds_north,
                south: p.bounds_south,
                east: p.bounds_east,
                west: p.bounds_west,
            }
        };
    });
}

export async function deleteCollection(collectionName: string) {
    try {
        await qdrant.deleteCollection(collectionName);
        console.log(`Collection "${collectionName}" deleted successfully.`);
    } catch (error) {
        console.error(`Failed to delete collection "${collectionName}":`, error);
    }
}

export async function deleteAllCollections() {
    try {
        const response = await qdrant.getCollections();
        const collections = response.collections.map(c => c.name);

        for (const name of collections) {
            await qdrant.deleteCollection(name);
            console.log(`Deleted collection: ${name}`);
        }

        console.log(`All collections deleted (${collections.length} total).`);
    } catch (error) {
        console.error('Failed to delete all collections:', error);
        throw error;
    }
}