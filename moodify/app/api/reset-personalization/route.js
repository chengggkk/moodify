// pages/api/reset-personalization.js
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing user ID' });
    }

    const { db, client } = await connectToDatabase();

    // Delete personalization data
    await db.collection('userPersonalization').deleteOne({ userId });
    
    // Delete LLM personalization instructions
    await db.collection('llmPersonalization').deleteOne({ userId });
    
    // Delete feedback history
    await db.collection('songFeedback').deleteMany({ userId });
    
    // Delete recommendation sessions
    await db.collection('recommendationSessions').deleteMany({ userId });

    await client.close();

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error resetting personalization:', error);
    return res.status(500).json({ error: 'Failed to reset personalization' });
  }
}