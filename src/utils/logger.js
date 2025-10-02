/**
 * Logging utility with consistent formatting
 */

const logger = {
  info: (category, message) => {
    console.log(`[${category}] ${message}`);
  },
  
  success: (category, message) => {
    console.log(`[${category}] ✓ ${message}`);
  },
  
  error: (category, message, error = null) => {
    console.error(`[${category}] ✗ ${message}`);
    if (error) {
      console.error(`[${category}] Error details:`, error.response?.data || error.message || error);
    }
  },
  
  warn: (category, message) => {
    console.warn(`[${category}] ⚠ ${message}`);
  },
  
  startup: (scriptName) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 ${scriptName} started`);
    console.log(`${'='.repeat(60)}\n`);
  },
  
  complete: (summary) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ Process completed');
    if (summary) {
      Object.entries(summary).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
    }
    console.log(`${'='.repeat(60)}\n`);
  }
};

module.exports = logger;

