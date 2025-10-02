/**
 * Main synchronization script
 * Syncs courses from the Course API to HubSpot HubDB
 */

require('dotenv').config();
const HubSpotClient = require('./utils/hubspot');
const { fetchAllCourses, transformCourseToRowData } = require('./utils/courses');
const logger = require('./utils/logger');

// Configuration
const CATALOG_TABLE_ID = '114590372';

async function syncCoursesToHubDB() {
  logger.startup('Course Sync to HubDB');

  const startTime = Date.now();
  let stats = {
    total: 0,
    created: 0,
    updated: 0,
    deleted: 0,
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

    // 4. Fetch table schema (for validation/debugging)
    logger.info('schema', 'Fetching table schema...');
    const columns = await hubspot.getTableSchema(CATALOG_TABLE_ID);
    if (columns) {
      logger.info('schema', `Table has ${columns.length} columns`);
    }

    // 5. Fetch all courses from API
    const courses = await fetchAllCourses();
    if (courses.length === 0) {
      logger.warn('api', 'No courses found. Exiting...');
      return;
    }

    stats.total = courses.length;
    logger.info('sync', `Starting sync for ${courses.length} courses from API...`);

    // 6. Fetch existing rows from HubDB
    logger.info('hubdb', 'Fetching existing rows from HubDB...');
    const existingRows = await hubspot.getAllRows(CATALOG_TABLE_ID);
    logger.info('hubdb', `Found ${existingRows.length} existing rows in HubDB`);

    // 7. Create a Set of API url_keys for fast lookup
    const apiUrlKeys = new Set(courses.map(c => c.url_key));

    // 8. Process each course (create/update)
    for (let i = 0; i < courses.length; i++) {
      const course = courses[i];
      const progress = `[${i + 1}/${courses.length}]`;

      try {
        // Check if row exists
        const existingRow = await hubspot.findRowByUrlKey(CATALOG_TABLE_ID, course.url_key);
        
        // Transform course data
        const rowData = transformCourseToRowData(course);

        if (existingRow) {
          // Update existing row
          const success = await hubspot.updateRow(CATALOG_TABLE_ID, existingRow.id, rowData);
          if (success) {
            logger.success('update', `${progress} Updated: ${course.name}`);
            stats.updated++;
          } else {
            stats.failed++;
          }
        } else {
          // Create new row
          const success = await hubspot.createRow(CATALOG_TABLE_ID, rowData);
          if (success) {
            logger.success('create', `${progress} Created: ${course.name}`);
            stats.created++;
          } else {
            stats.failed++;
          }
        }
      } catch (error) {
        logger.error('sync', `${progress} Failed to process: ${course.name}`, error);
        stats.failed++;
      }
    }

    // 9. Delete courses that exist in HubDB but not in API (cleanup stale data)
    logger.info('cleanup', 'Checking for courses to remove...');
    for (const row of existingRows) {
      const urlKey = row.values?.url_key;
      if (urlKey && !apiUrlKeys.has(urlKey)) {
        try {
          const success = await hubspot.deleteRow(CATALOG_TABLE_ID, row.id);
          if (success) {
            logger.success('delete', `Removed stale course: ${row.values?.title || row.name || urlKey}`);
            stats.deleted++;
          }
        } catch (error) {
          logger.error('delete', `Failed to delete stale course: ${urlKey}`, error);
        }
      }
    }

    if (stats.deleted > 0) {
      logger.info('cleanup', `Removed ${stats.deleted} stale courses from HubDB`);
    } else {
      logger.info('cleanup', 'No stale courses found - catalog is in sync');
    }

    // 10. Publish table
    logger.info('publish', 'Publishing table to make changes live...');
    await hubspot.publishTable(CATALOG_TABLE_ID);

    // 11. Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const successCount = stats.created + stats.updated + stats.deleted;
    const totalOperations = stats.total + stats.deleted;
    
    logger.complete({
      'API courses': stats.total,
      'HubDB before sync': existingRows.length,
      'Created': stats.created,
      'Updated': stats.updated,
      'Deleted': stats.deleted,
      'Failed': stats.failed,
      'HubDB after sync': existingRows.length + stats.created - stats.deleted,
      'Success rate': `${((successCount / totalOperations) * 100).toFixed(1)}%`,
      'Duration': `${duration}s`
    });

  } catch (error) {
    logger.error('sync', 'Fatal error during sync process', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  syncCoursesToHubDB();
}

// Export for use in other modules
module.exports = { syncCoursesToHubDB };

