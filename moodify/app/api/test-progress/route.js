// app/api/test-progress/route.js
import { NextResponse } from 'next/server';
import { ProgressTracker, progressStore } from '../recommendations/progressTracker.js';

export async function GET(request) {
  try {
    console.log('=== TEST PROGRESS API ===');
    
    // Create a test progress tracker
    const testRequestId = `test_${Date.now()}`;
    const tracker = new ProgressTracker(testRequestId);
    
    console.log('Created test tracker:', testRequestId);
    
    // Add some test steps
    await tracker.updateStep('test_step_1', 'active', 'Testing...');
    await tracker.completeStep('test_step_1', 'Test completed', 100);
    
    await tracker.updateStep('test_step_2', 'active', 'Testing step 2...');
    await tracker.completeStep('test_step_2', 'Step 2 completed', 200);
    
    await tracker.complete('Test finished');
    
    // Check what's in the store
    const storeContents = Array.from(progressStore.entries()).map(([key, value]) => ({
      requestId: key,
      status: value.status,
      steps: value.steps.length,
      currentStep: value.currentStep
    }));
    
    console.log('Progress store contents:', storeContents);
    
    return NextResponse.json({
      message: 'Test progress created successfully',
      testRequestId,
      storeContents,
      totalEntries: progressStore.size
    });
    
  } catch (error) {
    console.error('Test progress error:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { requestId } = await request.json();
    
    if (!requestId) {
      return NextResponse.json({
        error: 'Request ID required'
      }, { status: 400 });
    }
    
    // Get specific progress
    const progress = progressStore.get(requestId);
    
    return NextResponse.json({
      requestId,
      found: !!progress,
      progress: progress || null,
      allKeys: Array.from(progressStore.keys())
    });
    
  } catch (error) {
    console.error('Test progress POST error:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}