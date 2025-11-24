/**
 * Two-step sync strategy
 * Step 1: Cleanup (delete all and publish)
 * Step 2: Sync (create all courses)
 * 
 * This is the most reliable approach for HubDB
 */

require('dotenv').config();
const HubSpotClient = require('./utils/hubspot');
const { fetchAllCourses, transformCourseToRowData } = require('./utils/courses');
const logger = require('./utils/logger');

// Configuration
const CATALOG_TABLE_ID = '114590372';

async function twoStepSync() {
  logger.startup('Two-Step Course Sync');
  
  const overallStartTime = Date.now();
  const stats = {
    step1: {
      rowsDeleted: 0,
      duration: 0
    },
    step2: {
      rowsCreated: 0,
      rowsFailed: 0,
      duration: 0
    }
  };
  
  try {
    // Validate environment
    const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
    if (!token) {
      logger.error('config', 'HUBSPOT_PRIVATE_APP_TOKEN not found in .env file');
      process.exit(1);
    }

    // Initialize HubSpot client
    const hubspot = new HubSpotClient(token);
    
    // Test connection
    const connected = await hubspot.testConnection();
    if (!connected) {
      logger.error('connection', 'Failed to connect to HubSpot. Exiting...');
      process.exit(1);
    }

    // ========================================
    // STEP 1: CLEANUP
    // ========================================
    const step1Start = Date.now();
    logger.info('step1', '═══════════════════════════════════════════════════');
    logger.info('step1', '📋 STEP 1: Cleanup - Delete all existing courses');
    logger.info('step1', '═══════════════════════════════════════════════════');
    
    const existingRows = await hubspot.getAllRows(CATALOG_TABLE_ID);
    logger.info('step1', `Found ${existingRows.length} existing rows to delete`);

    if (existingRows.length > 0) {
      const rowIds = existingRows.map(row => row.id);
      logger.info('step1', 'Using batch delete for efficient deletion...');
      stats.step1.rowsDeleted = await hubspot.batchDeleteRows(CATALOG_TABLE_ID, rowIds);
      logger.success('step1', `Deleted ${stats.step1.rowsDeleted} rows`);
    } else {
      logger.info('step1', 'Table is already empty');
    }

    // Publish the empty table
    logger.info('step1', 'Publishing empty table...');
    await hubspot.publishTable(CATALOG_TABLE_ID);
    logger.success('step1', 'Table is now empty and published');
    
    stats.step1.duration = ((Date.now() - step1Start) / 1000).toFixed(2);
    
    // Wait for HubSpot to process
    logger.info('step1', 'Waiting 2 seconds for HubSpot to process...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // ========================================
    // STEP 2: SYNC
    // ========================================
    const step2Start = Date.now();
    logger.info('step2', '═══════════════════════════════════════════════════');
    logger.info('step2', '📥 STEP 2: Sync - Create all courses from API');
    logger.info('step2', '═══════════════════════════════════════════════════');
    
    // Fetch courses from API
    const courses = await fetchAllCourses();
    if (courses.length === 0) {
      logger.warn('step2', 'No courses found in API. Exiting...');
      return;
    }

    logger.info('step2', `Creating ${courses.length} courses in HubDB...`);

    // Create all courses
    for (let i = 0; i < courses.length; i++) {
      const course = courses[i];
      
      try {
        const rowData = transformCourseToRowData(course);
        const success = await hubspot.createRow(CATALOG_TABLE_ID, rowData);
        
        if (success) {
          stats.step2.rowsCreated++;
          if ((i + 1) % 100 === 0) {
            logger.info('step2', `Created ${stats.step2.rowsCreated}/${courses.length} courses...`);
          }
        } else {
          stats.step2.rowsFailed++;
        }
      } catch (error) {
        logger.error('step2', `Failed to create: ${course.name}`, error);
        stats.step2.rowsFailed++;
      }
    }

    // Publish the new table
    logger.info('step2', 'Publishing table with new courses...');
    await hubspot.publishTable(CATALOG_TABLE_ID);
    logger.success('step2', 'New courses published successfully');
    
    stats.step2.duration = ((Date.now() - step2Start) / 1000).toFixed(2);
    
    // ========================================
    // FINAL SUMMARY
    // ========================================
    const totalDuration = ((Date.now() - overallStartTime) / 1000).toFixed(2);
    const successRate = ((stats.step2.rowsCreated / courses.length) * 100).toFixed(1);
    
    logger.info('summary', '');
    logger.info('summary', '═══════════════════════════════════════════════════');
    logger.info('summary', '✅ TWO-STEP SYNC COMPLETE');
    logger.info('summary', '═══════════════════════════════════════════════════');
    logger.info('summary', '');
    logger.info('summary', '📊 STEP 1 - CLEANUP:');
    logger.info('summary', `   Rows Deleted: ${stats.step1.rowsDeleted}`);
    logger.info('summary', `   Duration: ${stats.step1.duration}s`);
    logger.info('summary', '');
    logger.info('summary', '📊 STEP 2 - SYNC:');
    logger.info('summary', `   API Courses: ${courses.length}`);
    logger.info('summary', `   Rows Created: ${stats.step2.rowsCreated}`);
    logger.info('summary', `   Rows Failed: ${stats.step2.rowsFailed}`);
    logger.info('summary', `   Duration: ${stats.step2.duration}s`);
    logger.info('summary', '');
    logger.info('summary', '📈 FINAL RESULT:');
    logger.info('summary', `   Table Before: ${stats.step1.rowsDeleted} courses`);
    logger.info('summary', `   Table After: ${stats.step2.rowsCreated} courses`);
    logger.info('summary', `   Success Rate: ${successRate}%`);
    logger.info('summary', `   Total Duration: ${totalDuration}s (${(totalDuration / 60).toFixed(1)} minutes)`);
    logger.info('summary', '═══════════════════════════════════════════════════');
    logger.info('summary', '');
    
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

