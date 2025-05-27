// app/api/song-feedback/route.js
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
    const { userId, trackId, feedback, prompt, timestamp } = body;

    // Log the received data for debugging
    console.log('Received song feedback:', { userId, trackId, feedback, prompt });

    // Validate required fields
    if (!userId || !trackId || !feedback || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate feedback value
    if (feedback !== 'match' && feedback !== 'no_match') {
      return NextResponse.json(
        { error: 'Invalid feedback value. Expected "match" or "no_match"' },
        { status: 400 }
      );
    }

    // Connect to the database
    const { db, client: dbClient } = await connectToDatabase();
    client = dbClient; // Store client for closing in finally block

    // Check if this user has already provided feedback for this track and prompt
    const existingFeedback = await db.collection('songFeedback').findOne({
      userId,
      trackId,
      prompt
    });

    // If feedback exists, update it
    if (existingFeedback) {
      await db.collection('songFeedback').updateOne(
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
      await db.collection('songFeedback').insertOne({
        userId,
        trackId,
        prompt,
        feedback,
        createdAt: timestamp || new Date().toISOString(),
        updatedAt: timestamp || new Date().toISOString()
      });
    }

    // Store the track info if not already stored
    const existingTrack = await db.collection('tracks').findOne({ id: trackId });
    if (!existingTrack) {
      try {
        // Simplified track storage - just the ID and timestamp
        await db.collection('tracks').insertOne({
          id: trackId,
          addedAt: timestamp || new Date().toISOString()
        });
      } catch (trackError) {
        console.error('Error storing track info:', trackError);
        // Continue processing even if track storage fails
      }
    }

    // Update recommendation statistics
    try {
      await updateRecommendationStats(db, trackId, prompt, feedback);
    } catch (statsError) {
      console.error('Error updating recommendation stats:', statsError);
      // Non-critical, continue processing
    }

    // Return success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing song feedback:', error);
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

// API route for checking existing feedback
export async function GET(request) {
  let client = null;
  try {
    // Get the query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const trackId = searchParams.get('trackId');
    const prompt = searchParams.get('prompt');

    // Validate required parameters
    if (!userId || !trackId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Connect to the database
    const { db, client: dbClient } = await connectToDatabase();
    client = dbClient;

    // Look for feedback for this user and track and prompt
    const query = {
      userId,
      trackId
    };
    
    // Add prompt to query if provided
    if (prompt) {
      query.prompt = prompt;
    }

    const existingFeedback = await db.collection('songFeedback').findOne(query);

    if (existingFeedback) {
      return NextResponse.json({ 
        feedback: existingFeedback.feedback,
        timestamp: existingFeedback.updatedAt || existingFeedback.createdAt
      });
    } else {
      return NextResponse.json({ feedback: null });
    }
  } catch (error) {
    console.error('Error checking song feedback:', error);
    return NextResponse.json(
      { error: `Failed to check feedback: ${error.message}` },
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

// Function to update recommendation statistics
async function updateRecommendationStats(db, trackId, prompt, feedback) {
  // Get or create stats entry for this prompt
  let statsDoc = await db.collection('recommendationStats').findOne({ prompt });
  
  if (!statsDoc) {
    statsDoc = {
      prompt,
      totalFeedback: 0,
      matchCount: 0,
      noMatchCount: 0,
      matchPercentage: 0,
      tracks: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // Update stats
  statsDoc.totalFeedback++;
  
  if (feedback === 'match') {
    statsDoc.matchCount++;
  } else {
    statsDoc.noMatchCount++;
  }
  
  statsDoc.matchPercentage = (statsDoc.matchCount / statsDoc.totalFeedback) * 100;
  
  // Track-specific stats
  if (!statsDoc.tracks[trackId]) {
    statsDoc.tracks[trackId] = {
      totalFeedback: 0,
      matchCount: 0,
      noMatchCount: 0,
      matchPercentage: 0
    };
  }
  
  statsDoc.tracks[trackId].totalFeedback++;
  
  if (feedback === 'match') {
    statsDoc.tracks[trackId].matchCount++;
  } else {
    statsDoc.tracks[trackId].noMatchCount++;
  }
  
  statsDoc.tracks[trackId].matchPercentage = 
    (statsDoc.tracks[trackId].matchCount / statsDoc.tracks[trackId].totalFeedback) * 100;
  
  statsDoc.updatedAt = new Date().toISOString();
  
  // Save updated stats
  await db.collection('recommendationStats').updateOne(
    { prompt: prompt },
    { $set: statsDoc },
    { upsert: true }
  );
}