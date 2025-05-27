// pages/api/user-personalization.js
import { MongoClient } from 'mongodb';

// MongoDB connection string - store this in your environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/moodify';
const MONGODB_DB = process.env.MONGODB_DB || 'moodify';

async function connectToDatabase() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);
  return { client, db };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'Missing user ID' });
    }

    const { db, client } = await connectToDatabase();

    // Get user's personalization data
    const personalization = await db.collection('userPersonalization').findOne({ userId });
    
    // If no personalization data exists, return empty data structure
    if (!personalization) {
      return res.status(200).json({
        userId,
        likedGenres: {},
        dislikedGenres: {},
        likedArtists: {},
        dislikedArtists: {},
        likedAudioFeatures: {},
        dislikedAudioFeatures: {},
        likedKeywords: {},
        dislikedKeywords: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // Get LLM personalization instructions
    const llmPersonalization = await db.collection('llmPersonalization').findOne({ userId });
    
    // Enrich personalization data with artist names if possible
    if (personalization.likedArtists && Object.keys(personalization.likedArtists).length > 0) {
      const artistIds = Object.keys(personalization.likedArtists);
      const artistsData = await db.collection('artists')
        .find({ id: { $in: artistIds } })
        .toArray();
      
      // Create a mapping from artist ID to name
      const artistNames = {};
      artistsData.forEach(artist => {
        artistNames[artist.id] = artist.name;
      });
      
      // Add artist names to the response
      personalization.artistNames = artistNames;
    }

    // Add LLM instructions if available
    if (llmPersonalization && llmPersonalization.instructions) {
      personalization.llmInstructions = llmPersonalization.instructions;
    }

    await client.close();

    return res.status(200).json(personalization);
  } catch (error) {
    console.error('Error fetching user personalization:', error);
    return res.status(500).json({ error: 'Failed to fetch user personalization' });
  }
}