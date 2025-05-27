// app/api/test/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  console.log('Simple test API called');
  
  return NextResponse.json({
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    status: 'success'
  });
}