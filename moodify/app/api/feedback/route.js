// app/api/feedback/route.js
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

// MongoDB connection string - store this in your environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/moodify';
const MONGODB_DB = process.env.MONGODB_DB || 'moodify';

async function connectToDatabase() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(MONGODB_DB);
    return { client, db };
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

export async function POST(request) {
  let client = null;
  try {
    // Parse the request body
    const body = await request.json();
    const { userId, trackId, feedback, timestamp } = body;

    // Validation
    if (!userId || !trackId || !feedback) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Connect to the database
    const { db, client: dbClient } = await connectToDatabase();
    client = dbClient; // Store client for closing in finally block

    // Check if this user has already provided feedback for this track
    const existingFeedback = await db.collection('userFeedback').findOne({
      userId,
      trackId
    });

    // If feedback exists, update it
    if (existingFeedback) {
      await db.collection('userFeedback').updateOne(
        { _id: existingFeedback._id },
        {
          $set: {
            feedback,
            updatedAt: timestamp || new Date().toISOString()
          }
        }
      );
    } else {
      // Otherwise, create a new feedback entry
      await db.collection('userFeedback').insertOne({
        userId,
        trackId,
        feedback,
        createdAt: timestamp || new Date().toISOString(),
        updatedAt: timestamp || new Date().toISOString()
      });
    }

    // Try to update user preferences based on feedback
    try {
      await updateUserPreferences(db, userId, trackId, feedback);
    } catch (updateError) {
      console.error('Error updating user preferences:', updateError);
      // Continue processing even if preference update fails
    }

    // Return success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing feedback:', error);
    return NextResponse.json(
      { error: 'Failed to process feedback', details: error.message },
      { status: 500 }
    );
  } finally {
    // Close the database connection
    if (client) {
      try {
        await client.close();
      } catch (closeError) {
        console.error('Error closing database connection:', closeError);
      }
    }
  }
}

// Function to update user preferences based on feedback
async function updateUserPreferences(db, userId, trackId, feedback) {
  try {
    // First, get the track details from Spotify tracks collection
    const track = await db.collection('tracks').findOne({ id: trackId });
    
    if (!track) {
      console.log('Track not found in database, skipping preference update');
      return;
    }

    // Get the user's preference document or create it if it doesn't exist
    let userPreferences = await db.collection('userPreferences').findOne({ userId });
    
    if (!userPreferences) {
      userPreferences = {
        userId,
        genres: {},
        artists: {},
        audioFeatures: {
          danceability: { count: 0, sum: 0 },
          energy: { count: 0, sum: 0 },
          valence: { count: 0, sum: 0 },
          tempo: { count: 0, sum: 0 },
          acousticness: { count: 0, sum: 0 },
          instrumentalness: { count: 0, sum: 0 }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    // Update based on feedback type
    const weight = feedback === 'like' ? 1 : -1;

    // Update genre preferences
    if (track.genres && track.genres.length > 0) {
      track.genres.forEach(genre => {
        userPreferences.genres[genre] = (userPreferences.genres[genre] || 0) + weight;
      });
    }

    // Update artist preferences
    if (track.artists && track.artists.length > 0) {
      track.artists.forEach(artist => {
        const artistId = artist.id || artist;
        userPreferences.artists[artistId] = (userPreferences.artists[artistId] || 0) + weight;
      });
    }

    // Update audio feature preferences
    if (track.audioFeatures) {
      const features = ['danceability', 'energy', 'valence', 'tempo', 'acousticness', 'instrumentalness'];
      
      features.forEach(feature => {
        if (track.audioFeatures[feature] !== undefined) {
          // Only update for likes (for dislikes, we just want to avoid similar features)
          if (feedback === 'like') {
            userPreferences.audioFeatures[feature].count += 1;
            userPreferences.audioFeatures[feature].sum += track.audioFeatures[feature];
          }
        }
      });
    }

    // Update or insert the user preferences
    await db.collection('userPreferences').updateOne(
      { userId },
      { $set: userPreferences },
      { upsert: true }
    );

    console.log(`Updated preferences for user ${userId} based on ${feedback} feedback for track ${trackId}`);
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw error; // Rethrow to handle in the calling function
  }
}