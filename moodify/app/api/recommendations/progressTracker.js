// app/api/recommendations/progressTracker.js

// In-memory store for tracking recommendation progress
// In production, you'd want to use Redis or a database
const progressStore = new Map();

export class ProgressTracker {
  constructor(requestId) {
    this.requestId = requestId;
    this.startTime = Date.now();
    this.steps = [];
    
    console.log('ProgressTracker created for:', requestId);
    
    // Initialize progress in store
    progressStore.set(requestId, {
      status: 'processing',
      currentStep: null,
      steps: [],
      totalDuration: 0,
      error: null,
      updatedAt: new Date().toISOString()
    });
  }

  async updateStep(stepName, status = 'active', result = null, duration = null) {
    try {
      const stepUpdate = {
        name: stepName,
        status, // 'active', 'completed', 'error'
        result,
        duration: duration || (Date.now() - this.startTime),
        timestamp: new Date().toISOString()
      };

      console.log('Updating step:', stepName, status, result);

      // Update or add step
      const existingStepIndex = this.steps.findIndex(s => s.name === stepName);
      if (existingStepIndex >= 0) {
        this.steps[existingStepIndex] = { ...this.steps[existingStepIndex], ...stepUpdate };
      } else {
        this.steps.push(stepUpdate);
      }

      // Update progress store
      const currentProgress = progressStore.get(this.requestId) || {};
      const updatedProgress = {
        ...currentProgress,
        status: status === 'error' ? 'error' : 'processing',
        currentStep: status === 'completed' ? null : stepName,
        steps: this.steps,
        totalDuration: Date.now() - this.startTime,
        updatedAt: new Date().toISOString()
      };

      progressStore.set(this.requestId, updatedProgress);

      console.log(`Progress updated for ${this.requestId}: ${stepName} - ${status}`);
      
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  }

  async completeStep(stepName, result = null, duration = null) {
    await this.updateStep(stepName, 'completed', result, duration);
  }

  async setError(stepName, error) {
    console.log('Setting error for step:', stepName, error);
    await this.updateStep(stepName, 'error', `Error: ${error}`, Date.now() - this.startTime);
    
    const currentProgress = progressStore.get(this.requestId) || {};
    progressStore.set(this.requestId, {
      ...currentProgress,
      status: 'error',
      error: error,
      updatedAt: new Date().toISOString()
    });
  }

  async complete(finalResult = null) {
    console.log('Completing progress for:', this.requestId);
    const currentProgress = progressStore.get(this.requestId) || {};
    progressStore.set(this.requestId, {
      ...currentProgress,
      status: 'completed',
      currentStep: null,
      totalDuration: Date.now() - this.startTime,
      result: finalResult,
      updatedAt: new Date().toISOString()
    });
  }
}

// Export the progress store for access from other APIs
export { progressStore };