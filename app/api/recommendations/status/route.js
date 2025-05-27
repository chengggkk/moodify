import { NextResponse } from 'next/server';
import { 
  ProgressTracker, 
  STEP_DEFINITIONS, 
  getProgressData, 
  setProgressData, 
  deleteProgressData, 
  getAllActiveProgress,
  getStoreSize 
} from '../../../lib/progressStore';

// GET endpoint to fetch progress status
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json({
        error: 'Missing requestId parameter'
      }, { status: 400 });
    }

    console.log(`GET request for progress: ${requestId} (store size: ${getStoreSize()})`);
    const progressData = getProgressData(requestId);

    if (!progressData) {
      console.log(`Progress data not found for: ${requestId}`);
      return NextResponse.json({
        error: 'Progress data not found',
        requestId: requestId,
        storeSize: getStoreSize(),
        availableRequests: getAllActiveProgress().map(p => p.requestId)
      }, { status: 404 });
    }

    // Sort steps by order for consistent display
    const sortedSteps = [...progressData.steps].sort((a, b) => {
      const aOrder = STEP_DEFINITIONS[a.name]?.order || 999;
      const bOrder = STEP_DEFINITIONS[b.name]?.order || 999;
      return aOrder - bOrder;
    });

    // Calculate progress percentage
    const totalSteps = sortedSteps.length;
    const completedSteps = sortedSteps.filter(s => s.completed).length;
    const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    // Estimate time remaining
    let estimatedTimeRemaining = null;
    if (progressData.status === 'active' && progressData.currentStep) {
      const currentStepDef = STEP_DEFINITIONS[progressData.currentStep];
      const remainingSteps = sortedSteps.filter(s => !s.completed && s.name !== progressData.currentStep);
      
      const currentStepEstimate = currentStepDef?.estimatedDuration || 2000;
      const remainingStepsEstimate = remainingSteps.reduce((total, step) => {
        const stepDef = STEP_DEFINITIONS[step.name];
        return total + (stepDef?.estimatedDuration || 2000);
      }, 0);
      
      estimatedTimeRemaining = currentStepEstimate + remainingStepsEstimate;
    }

    const response = {
      requestId: progressData.requestId,
      status: progressData.status,
      currentStep: progressData.currentStep,
      steps: sortedSteps,
      progress: {
        percentage: progressPercentage,
        completedSteps: completedSteps,
        totalSteps: totalSteps,
        estimatedTimeRemaining: estimatedTimeRemaining
      },
      timing: {
        startTime: progressData.startTime,
        lastUpdated: progressData.lastUpdated,
        totalDuration: progressData.totalDuration || (Date.now() - progressData.startTime),
        endTime: progressData.endTime || null
      },
      error: progressData.error,
      result: progressData.result
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching progress status:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
}

// POST endpoint to manually update progress (for testing or external updates)
export async function POST(request) {
  try {
    const body = await request.json();
    const { requestId, stepName, status, message, result, action } = body;

    if (!requestId) {
      return NextResponse.json({
        error: 'Missing requestId'
      }, { status: 400 });
    }

    // Handle different actions
    switch (action) {
      case 'create':
        // Create new progress tracker
        const tracker = new ProgressTracker(requestId);
        return NextResponse.json({
          message: 'Progress tracker created',
          requestId: requestId
        });

      case 'update':
        if (!stepName || !status) {
          return NextResponse.json({
            error: 'Missing stepName or status for update'
          }, { status: 400 });
        }

        const progressData = getProgressData(requestId);
        if (!progressData) {
          return NextResponse.json({
            error: 'Progress data not found'
          }, { status: 404 });
        }

        // Create a temporary tracker to use the update methods
        const tempTracker = new ProgressTracker(requestId);
        // Don't create new data, just use existing
        
        if (status === 'completed') {
          await tempTracker.completeStep(stepName, result);
        } else {
          await tempTracker.updateStep(stepName, status, message, result);
        }

        return NextResponse.json({
          message: 'Step updated successfully',
          requestId: requestId,
          step: stepName,
          status: status
        });

      case 'complete':
        const completeData = getProgressData(requestId);
        if (completeData) {
          const completeTracker = new ProgressTracker(requestId);
          await completeTracker.complete(result);
        }

        return NextResponse.json({
          message: 'Progress completed',
          requestId: requestId
        });

      case 'error':
        const errorData = getProgressData(requestId);
        if (errorData) {
          const errorTracker = new ProgressTracker(requestId);
          await errorTracker.setError(stepName, message);
        }

        return NextResponse.json({
          message: 'Error set',
          requestId: requestId
        });

      default:
        return NextResponse.json({
          error: 'Invalid action. Use: create, update, complete, or error'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
}

// DELETE endpoint to clean up progress data
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json({
        error: 'Missing requestId parameter'
      }, { status: 400 });
    }

    const existed = deleteProgressData(requestId);

    return NextResponse.json({
      message: existed ? 'Progress data deleted' : 'Progress data not found',
      requestId: requestId,
      existed: existed
    });

  } catch (error) {
    console.error('Error deleting progress data:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
}

// Utility function to get all active progress sessions (for debugging)
export function getAllActiveProgressSessions() {
  return getAllActiveProgress();
}