/**
 * HubSpot API utility functions
 */

const axios = require('axios');
const logger = require('./logger');

const HUBSPOT_API_BASE = 'https://api.hubapi.com';

class HubSpotClient {
  constructor(token) {
    if (!token) {
      throw new Error('HubSpot API token is required');
    }
    this.token = token;
    this.headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Test connection to HubSpot API
   */
  async testConnection() {
    try {
      await axios.get(`${HUBSPOT_API_BASE}/cms/v3/hubdb/tables`, {
        headers: this.headers
      });
      logger.success('connection', 'Successfully connected to HubSpot API');
      return true;
    } catch (error) {
      logger.error('connection', 'Failed to connect to HubSpot API', error);
      return false;
    }
  }

  /**
   * Fetch table schema
   */
  async getTableSchema(tableId) {
    try {
      const response = await axios.get(
        `${HUBSPOT_API_BASE}/cms/v3/hubdb/tables/${tableId}`,
        { headers: this.headers }
      );
      logger.success('schema', `Retrieved schema for table ${tableId}`);
      return response.data.columns;
    } catch (error) {
      logger.error('schema', `Failed to fetch schema for table ${tableId}`, error);
      return null;
    }
  }

  /**
   * Get all rows from a table (with pagination)
   */
  async getAllRows(tableId) {
    try {
      let allRows = [];
      let offset = 0;
      const limit = 1000;
      let hasMore = true;

      while (hasMore) {
        const response = await axios.get(
          `${HUBSPOT_API_BASE}/cms/v3/hubdb/tables/${tableId}/rows`,
          {
            params: { limit, offset },
            headers: this.headers
          }
        );
        
        const rows = response.data.objects || [];
        allRows = allRows.concat(rows);
        
        if (rows.length < limit) {
          hasMore = false;
        } else {
          offset += limit;
        }
      }

      logger.info('fetch', `Retrieved ${allRows.length} rows from table ${tableId}`);
      return allRows;
    } catch (error) {
      logger.error('fetch', `Failed to fetch rows from table ${tableId}`, error);
      return [];
    }
  }

  /**
   * Find a row by url_key
   */
  async findRowByUrlKey(tableId, urlKey) {
    try {
      const response = await axios.get(
        `${HUBSPOT_API_BASE}/cms/v3/hubdb/tables/${tableId}/rows`,
        {
          params: { url_key__eq: urlKey },
          headers: this.headers
        }
      );
      return response.data.objects && response.data.objects.length > 0
        ? response.data.objects[0]
        : null;
    } catch (error) {
      logger.error('query', `Failed to find row with url_key: ${urlKey}`, error);
      return null;
    }
  }

  /**
   * Create a new row
   */
  async createRow(tableId, rowData) {
    try {
      await axios.post(
        `${HUBSPOT_API_BASE}/cms/v3/hubdb/tables/${tableId}/rows`,
        rowData,
        { headers: this.headers }
      );
      return true;
    } catch (error) {
      logger.error('create', `Failed to create row`, error);
      return false;
    }
  }

  /**
   * Update an existing row
   */
  async updateRow(tableId, rowId, rowData) {
    try {
      await axios.put(
        `${HUBSPOT_API_BASE}/cms/v3/hubdb/tables/${tableId}/rows/${rowId}`,
        rowData,
        { headers: this.headers }
      );
      return true;
    } catch (error) {
      logger.error('update', `Failed to update row ${rowId}`, error);
      return false;
    }
  }

  /**
   * Delete a row
   */
  async deleteRow(tableId, rowId) {
    try {
      await axios.delete(
        `${HUBSPOT_API_BASE}/cms/v3/hubdb/tables/${tableId}/rows/${rowId}`,
        { headers: this.headers }
      );
      return true;
    } catch (error) {
      logger.error('delete', `Failed to delete row ${rowId}`, error);
      return false;
    }
  }

  /**
   * Publish table to make changes live
   */
  async publishTable(tableId) {
    try {
      await axios.post(
        `${HUBSPOT_API_BASE}/cms/v3/hubdb/tables/${tableId}/draft/publish`,
        {},
        { headers: this.headers }
      );
      logger.success('publish', `Table ${tableId} published successfully`);
      return true;
    } catch (error) {
      logger.error('publish', `Failed to publish table ${tableId}`, error);
      return false;
    }
  }
}

module.exports = HubSpotClient;

