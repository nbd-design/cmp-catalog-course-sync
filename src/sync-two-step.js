/**
 * Two-step sync strategy
 * Step 1: Cleanup (delete all and publish)
 * Step 2: Sync (create all courses)
 * 
 * This is the most reliable approach for HubDB
 */

require('dotenv').config();
const { cleanupTables } = require('./cleanup');
const { syncCoursesFullReplace } = require('./sync-full-replace');
const logger = require('./utils/logger');

async function twoStepSync() {
  logger.startup('Two-Step Course Sync');
  
  try {
    // Step 1: Clean up existing data
    logger.info('step1', 'STEP 1: Running cleanup to remove all existing courses...');
    await cleanupTables();
    
    logger.info('step1', '✓ Cleanup complete. Table is now empty and published.');
    logger.info('step1', 'Waiting 2 seconds for HubSpot to process...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 2: Sync new data
    logger.info('step2', 'STEP 2: Running sync to add all courses from API...');
    await syncCoursesFullReplace();
    
    logger.complete({
      'Process': 'Two-Step Sync',
      'Result': 'Success'
    });
    
  } catch (error) {
    logger.error('sync', 'Two-step sync failed', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  twoStepSync();
}

module.exports = { twoStepSync };

