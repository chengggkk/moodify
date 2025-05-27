// app/api/check-feedback/route.js
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

// MongoDB connection string - store this in your environment variables
const MONGODB_URI = process.env.MONGODB_URI
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

export async function GET(request) {
  let client = null;
  try {
    // Get the query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const trackId = searchParams.get('trackId');

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

    // Look for feedback for this user and track
    const existingFeedback = await db.collection('userFeedback').findOne({
      userId,
      trackId
    });

    if (existingFeedback) {
      return NextResponse.json({ 
        feedback: existingFeedback.feedback,
        timestamp: existingFeedback.updatedAt || existingFeedback.createdAt
      });
    } else {
      return NextResponse.json({ feedback: null });
    }
  } catch (error) {
    console.error('Error checking feedback:', error);
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