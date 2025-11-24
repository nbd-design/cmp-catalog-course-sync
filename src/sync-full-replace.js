/**
 * Full replacement sync strategy
 * Deletes ALL rows, then re-uploads all courses from API
 * 
 * PROS: Simple, guaranteed clean slate, no comparison logic needed
 * CONS: Slower (more API calls), brief moment where table is empty
 * 
 * Use this if differential sync is having issues
 */

require('dotenv').config();
const HubSpotClient = require('./utils/hubspot');
const { fetchAllCourses, transformCourseToRowData } = require('./utils/courses');
const logger = require('./utils/logger');

// Configuration
const CATALOG_TABLE_ID = '114590372';

async function syncCoursesFullReplace() {
  logger.startup('Course Sync to HubDB (FULL REPLACEMENT)');

  const startTime = Date.now();
  let stats = {
    deletedOld: 0,
    created: 0,
    failed: 0
  };

  try {
    // 1. Validate environment
    const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
    if (!token) {
      logger.error('config', 'HUBSPOT_PRIVATE_APP_TOKEN not found in .env file');
      process.exit(1);
    }

    // 2. Initialize HubSpot client
    const hubspot = new HubSpotClient(token);
    
    // 3. Test connection
    const connected = await hubspot.testConnection();
    if (!connected) {
      logger.error('connection', 'Failed to connect to HubSpot. Exiting...');
      process.exit(1);
    }

    // 4. STEP 1: Delete all existing rows
    logger.info('cleanup', 'STEP 1: Deleting all existing rows...');
    const existingRows = await hubspot.getAllRows(CATALOG_TABLE_ID);
    logger.info('cleanup', `Found ${existingRows.length} existing rows to delete`);

    for (let i = 0; i < existingRows.length; i++) {
      const row = existingRows[i];
      const progress = `[${i + 1}/${existingRows.length}]`;
      
      try {
        const success = await hubspot.deleteRow(CATALOG_TABLE_ID, row.id);
        if (success) {
          stats.deletedOld++;
          if (i % 100 === 0) {
            logger.info('delete', `${progress} Deleted ${stats.deletedOld} rows...`);
          }
        }
      } catch (error) {
        logger.error('delete', `${progress} Failed to delete row ${row.id}`, error);
      }
    }
    
    logger.success('cleanup', `Deleted ${stats.deletedOld} rows`);

    // 5. CRITICAL: Publish deletions before creating new rows
    logger.info('publish', 'Publishing deletions (required before creating new rows)...');
    await hubspot.publishTable(CATALOG_TABLE_ID);
    logger.success('publish', 'Deletions published - table is now empty');

    // 6. STEP 2: Fetch all courses from API
    logger.info('api', 'STEP 2: Fetching courses from API...');
    const courses = await fetchAllCourses();
    if (courses.length === 0) {
      logger.warn('api', 'No courses found. Exiting...');
      return;
    }

    logger.info('sync', `STEP 3: Creating ${courses.length} fresh rows...`);

    // 7. STEP 3: Create all courses as new rows
    for (let i = 0; i < courses.length; i++) {
      const course = courses[i];
      const progress = `[${i + 1}/${courses.length}]`;

      try {
        const rowData = transformCourseToRowData(course);
        const success = await hubspot.createRow(CATALOG_TABLE_ID, rowData);
        
        if (success) {
          stats.created++;
          if (i % 100 === 0) {
            logger.info('create', `${progress} Created ${stats.created} courses...`);
          }
        } else {
          stats.failed++;
        }
      } catch (error) {
        logger.error('sync', `${progress} Failed to create: ${course.name}`, error);
        stats.failed++;
      }
    }

    // 8. STEP 4: Publish table (final publish with new courses)
    logger.info('publish', 'STEP 4: Publishing new courses to make them live...');
    await hubspot.publishTable(CATALOG_TABLE_ID);

    // 8. Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    logger.complete({
      'Old rows deleted': stats.deletedOld,
      'New rows created': stats.created,
      'Failed': stats.failed,
      'Final count': stats.created,
      'Success rate': `${((stats.created / courses.length) * 100).toFixed(1)}%`,
      'Duration': `${duration}s`
    });

  } catch (error) {
    logger.error('sync', 'Fatal error during sync process', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  syncCoursesFullReplace().catch(error => {
    console.error('Sync failed:', error);
    process.exit(1);
  });
}

// Export for use in other modules
module.exports = { syncCoursesFullReplace };

