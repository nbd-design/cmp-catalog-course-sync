/**
 * Cleanup script
 * Removes all rows from specified HubDB tables
 * USE WITH CAUTION - This will delete all data!
 */

require('dotenv').config();
const HubSpotClient = require('./utils/hubspot');
const logger = require('./utils/logger');

// Configuration
const TABLE_IDS = ['114590372'];

async function cleanupTables() {
  logger.startup('HubDB Cleanup Script');
  logger.warn('cleanup', '⚠️  This will DELETE ALL ROWS from the specified tables!');

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

    // 4. Process each table
    for (const tableId of TABLE_IDS) {
      logger.info('cleanup', `Processing table ${tableId}...`);

      // Get all rows
      const rows = await hubspot.getAllRows(tableId);
      
      if (rows.length === 0) {
        logger.info('cleanup', `Table ${tableId} is already empty`);
        continue;
      }

      logger.warn('cleanup', `Found ${rows.length} rows to delete in table ${tableId}`);

      // Delete all rows
      let deleted = 0;
      let failed = 0;

      for (const row of rows) {
        const success = await hubspot.deleteRow(tableId, row.id);
        if (success) {
          deleted++;
          logger.info('delete', `Deleted row ${row.id} (${deleted}/${rows.length})`);
        } else {
          failed++;
        }
      }

      logger.info('cleanup', `Table ${tableId} cleanup complete: ${deleted} deleted, ${failed} failed`);

      // Publish table
      logger.info('publish', `Publishing table ${tableId}...`);
      await hubspot.publishTable(tableId);
    }

    logger.complete({
      'Tables processed': TABLE_IDS.length
    });

  } catch (error) {
    logger.error('cleanup', 'Fatal error during cleanup', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  cleanupTables();
}

module.exports = { cleanupTables };

