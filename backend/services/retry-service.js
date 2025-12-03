class RetryService {
  // Exponential backoff
  static async exponentialBackoff(fn, maxRetries = 3, initialDelayMs = 1000) {
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt + 1}/${maxRetries}`);
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries - 1) {
          const delayMs = initialDelayMs * Math.pow(2, attempt);
          console.warn(`⚠️ Attempt ${attempt + 1} failed: ${error.message}`);
          console.log(`⏳ Retrying in ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    console.error(`❌ All ${maxRetries} attempts failed`);
    throw lastError;
  }

  // Linear backoff
  static async linearBackoff(fn, maxRetries = 3, delayMs = 1000) {
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    throw lastError;
  }

  // Jittered backoff (adds randomness to avoid thundering herd)
  static async jitteredBackoff(fn, maxRetries = 3, initialDelayMs = 1000) {
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries - 1) {
          // Exponential backoff with jitter: delay * (2^attempt) + random(0, jitter)
          const baseDelay = initialDelayMs * Math.pow(2, attempt);
          const jitter = Math.random() * baseDelay * 0.1;
          const totalDelay = baseDelay + jitter;

          console.warn(`⚠️ Attempt ${attempt + 1} failed: ${error.message}`);
          console.log(`⏳ Retrying in ${totalDelay.toFixed(0)}ms (jittered)...`);
          await new Promise(resolve => setTimeout(resolve, totalDelay));
        }
      }
    }

    throw lastError;
  }

  // Circuit breaker pattern
  static createCircuitBreaker(fn, threshold = 5, timeout = 60000) {
    let failureCount = 0;
    let lastFailureTime = null;
    let state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN

    return async (...args) => {
      // If circuit is OPEN, check if timeout has passed
      if (state === 'OPEN') {
        if (Date.now() - lastFailureTime > timeout) {
          console.log('🔌 Circuit breaker: HALF_OPEN (testing recovery)');
          state = 'HALF_OPEN';
        } else {
          throw new Error('Circuit breaker is OPEN (service temporarily unavailable)');
        }
      }

      try {
        const result = await fn(...args);

        // Success: reset state
        if (state === 'HALF_OPEN') {
          console.log('🔌 Circuit breaker: CLOSED (recovered)');
          state = 'CLOSED';
          failureCount = 0;
        }

        return result;
      } catch (error) {
        failureCount++;
        lastFailureTime = Date.now();

        if (failureCount >= threshold) {
          console.error(`🔌 Circuit breaker: OPEN (${failureCount} failures)`);
          state = 'OPEN';
        }

        throw error;
      }
    };
  }
}

module.exports = RetryService;
