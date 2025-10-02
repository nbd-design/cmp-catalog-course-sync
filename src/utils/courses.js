/**
 * Course API utility functions
 */

const axios = require('axios');
const logger = require('./logger');

const COURSES_API_BASE = 'https://d2uj9jw4vo3cg6.cloudfront.net/V1/storeview/default/search/products';

/**
 * Fetch all courses from the API with pagination
 */
async function fetchAllCourses() {
  try {
    let courses = [];
    let page = 1;
    let hasMore = true;

    logger.info('api', 'Fetching courses from API...');

    while (hasMore) {
      const response = await axios.get(COURSES_API_BASE, {
        params: {
          'featured-only': 0,
          'page_size': 20,
          'page': page
        }
      });

      const items = response.data.items;
      
      if (items.length === 0) {
        hasMore = false;
      } else {
        courses = courses.concat(items);
        logger.info('api', `Fetched page ${page} (${items.length} courses)`);
        page++;
      }
    }

    logger.success('api', `Retrieved ${courses.length} total courses`);
    return courses;
  } catch (error) {
    logger.error('api', 'Failed to fetch courses', error);
    return [];
  }
}

/**
 * Calculate credits from raw value
 */
function calculateCredits(rawCredits) {
  if (!rawCredits) return '0';
  const credits = parseFloat(rawCredits) / 50;
  return credits.toFixed(3).replace(/\.?0+$/, '');
}

/**
 * Generate SEO keywords from course data
 */
function generateKeywords(course) {
  const keywords = [
    course.name,
    course.vendor?.name,
    course.attributes.find(attr => attr.code === 'lcv_fields_of_study_value')?.option_value,
    course.attributes.find(attr => attr.code === 'lcv_level')?.option_value,
    course.attributes.find(attr => attr.code === 'lcv_delivery_method')?.option_value
  ];
  return keywords.filter(Boolean).join(', ');
}

/**
 * Transform course data into HubDB row format
 */
function transformCourseToRowData(course) {
  // Extract attributes once
  const fieldsOfStudy = course.attributes.find(attr => attr.code === 'lcv_fields_of_study_value')?.option_value;
  const programQualifications = course.attributes.find(attr => attr.code === 'lcv_program_qualifications_value')?.option_value;
  const rawCredits = course.attributes.find(attr => attr.code === 'lcv_total_credits')?.option_value;
  const level = course.attributes.find(attr => attr.code === 'lcv_level')?.option_value;
  const deliveryMethod = course.attributes.find(attr => attr.code === 'lcv_delivery_method')?.option_value;
  const length = course.attributes.find(attr => attr.code === 'lcv_length')?.option_value;
  const subscription = course.attributes.find(attr => attr.code === 'subs_enabled')?.option_value;

  return {
    name: course.name,
    path: course.url_key,
    values: {
      title: course.name,
      short_description: course.short_description,
      instructor: course.vendor?.name,
      price: course.prices_unformatted?.price || 0,
      fields_of_study: Array.isArray(fieldsOfStudy) 
        ? fieldsOfStudy.join(', ')
        : fieldsOfStudy || '',
      level: level,
      delivery_method: deliveryMethod,
      length: length,
      credits: calculateCredits(rawCredits),
      image_url: course.image_url,
      url_key: course.url_key,
      vendor_id: course.vendor?.id,
      vendor_name: course.vendor?.name,
      vendor_logo: course.vendor?.logo_src,
      vendor_link: course.vendor?.link,
      program_qualifications: Array.isArray(programQualifications)
        ? programQualifications.join(', ')
        : programQualifications || '',
      raw_credits: rawCredits,
      sku: course.sku,
      product_type: course.product_type,
      last_updated: Date.now(),
      status: 'Active',
      seo_title: course.name,
      seo_description: course.short_description,
      seo_keywords: generateKeywords(course),
      subscription: subscription || 0
    }
  };
}

module.exports = {
  fetchAllCourses,
  calculateCredits,
  generateKeywords,
  transformCourseToRowData
};

