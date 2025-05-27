// app/api/feedback-count/route.js
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

export async function GET(request) {
  let client = null;
  try {
    // Get the query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user ID' },
        { status: 400 }
      );
    }

    // Connect to the database
    const { db, client: dbClient } = await connectToDatabase();
    client = dbClient;

    // Count all feedback entries for this user
    const userFeedbackCount = await db.collection('userFeedback').countDocuments({ userId });
    
    // Count song feedback entries for this user
    const songFeedbackCount = await db.collection('songFeedback').countDocuments({ userId });
    
    // Total feedback is the sum of both types
    const totalFeedbackCount = userFeedbackCount + songFeedbackCount;

    return NextResponse.json({ 
      count: totalFeedbackCount,
      userFeedbackCount,
      songFeedbackCount
    });
  } catch (error) {
    console.error('Error counting feedback:', error);
    return NextResponse.json(
      { error: `Failed to count feedback: ${error.message}` },
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