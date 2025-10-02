# HubSpot Course Sync 🚀

Automated synchronization of course catalog data from a Course API to HubSpot HubDB. This project runs daily via GitHub Actions to keep your HubSpot course catalog up-to-date.

## Features

✅ **Automated Daily Sync** - Runs automatically every day via GitHub Actions  
✅ **Manual Trigger** - Run on-demand from GitHub Actions UI  
✅ **Email Reports** - Automated email notifications with sync results ([Setup Guide](EMAIL_SETUP.md))  
✅ **Smart Upsert** - Creates new courses or updates existing ones  
✅ **Comprehensive Logging** - Detailed execution logs with emoji indicators  
✅ **Job Summaries** - Beautiful summaries in GitHub Actions UI  
✅ **Error Handling** - Graceful error handling with detailed error messages  
✅ **Clean Architecture** - Well-organized code with separate utilities  
✅ **Secure** - Uses GitHub Secrets for API token management  

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [GitHub Actions Setup](#github-actions-setup)
- [Email Notifications](#email-notifications)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Data Mapping](#data-mapping)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 14 or higher
- HubSpot account with API access
- HubSpot Private App token with HubDB permissions
- GitHub account (for automated sync)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/hubspot-course-sync.git
   cd hubspot-course-sync
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your HubSpot Private App token:
   ```
   HUBSPOT_PRIVATE_APP_TOKEN=your_token_here
   ```

## Configuration

### HubSpot Setup

1. **Create a Private App in HubSpot**
   - Go to Settings > Integrations > Private Apps
   - Click "Create a private app"
   - Name it "Course Sync"
   - Under Scopes, enable:
     - `cms.hubdb` (Read and Write)
   - Click "Create app" and copy the token

2. **Table ID**
   - The default table ID is `114590372`
   - To change this, edit `src/sync.js` and `src/cleanup.js`

### Course API

The script fetches courses from:
```
https://d2uj9jw4vo3cg6.cloudfront.net/V1/storeview/default/search/products
```

If your API endpoint is different, update it in `src/utils/courses.js`.

## Usage

### Local Execution

**Sync courses to HubDB:**
```bash
npm run sync
```

**Clean up HubDB (delete all rows):**
```bash
npm run cleanup
```
⚠️ **Warning:** The cleanup script will delete ALL rows from the table!

### Testing

To verify your setup before running:
```bash
# Test that your token works
node -e "require('dotenv').config(); const HS = require('./src/utils/hubspot'); new HS(process.env.HUBSPOT_PRIVATE_APP_TOKEN).testConnection()"
```

## GitHub Actions Setup

### 1. Add Secret to GitHub

1. Go to your repository on GitHub
2. Click Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Name: `HUBSPOT_PRIVATE_APP_TOKEN`
5. Value: Your HubSpot Private App token
6. Click "Add secret"

### 2. Automated Daily Sync

The workflow runs automatically every day at 2 AM UTC. To change the schedule, edit `.github/workflows/daily-sync.yml`:

```yaml
schedule:
  - cron: '0 2 * * *'  # Change this to your preferred time
```

**Cron Examples:**
- `0 2 * * *` - Every day at 2 AM UTC
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 1` - Every Monday at midnight

### 3. Manual Trigger

To run the sync manually:
1. Go to Actions tab in your GitHub repository
2. Click "Daily Course Sync" workflow
3. Click "Run workflow" button
4. Select branch and click "Run workflow"

## Email Notifications

Get automated email reports with sync results! 📧

### Features
- **Detailed metrics** - Total, created, updated, failed courses
- **Success/failure status** - Get reports for every sync with complete stats
- **Direct links** - Click through to detailed logs
- **Always informed** - Reports sent after every sync (successful or failed)

### Quick Setup (Gmail)

1. **Create Gmail App Password**
   - Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
   - Generate a password for "HubSpot Sync"

2. **Add GitHub Secrets** (Settings → Secrets and variables → Actions)
   ```
   SMTP_SERVER = smtp.gmail.com
   SMTP_PORT = 587
   SMTP_USERNAME = your.email@gmail.com
   SMTP_PASSWORD = (app password from step 1)
   NOTIFICATION_EMAIL = recipient@example.com
   ```

3. **Done!** You'll receive email reports after every sync (both successful and failed)

### Detailed Setup Guide

See **[EMAIL_SETUP.md](EMAIL_SETUP.md)** for:
- Gmail setup (step-by-step)
- SendGrid setup (100 free emails/day)
- Microsoft 365 / Outlook setup
- Custom SMTP server setup
- Troubleshooting tips

### Example Email Report

```
Subject: ✅ HubSpot Course Sync - Success

HubSpot Course Sync Report
==========================================

Status: ✅ SUCCESS
Date: 2025-10-02T02:00:00Z

Sync Results:
- Total Courses: 142
- Created: 8
- Updated: 134
- Failed: 0
- Success Rate: 100.0%
- Duration: 45.32s

View detailed logs: [link to GitHub Actions run]
```

### GitHub Job Summary

Even without email, you'll see a beautiful summary in the Actions UI after each run! 

## Project Structure

```
hubspot-course-sync/
├── .github/
│   └── workflows/
│       └── daily-sync.yml       # GitHub Actions workflow
├── src/
│   ├── utils/
│   │   ├── hubspot.js          # HubSpot API client
│   │   ├── courses.js          # Course API utilities
│   │   └── logger.js           # Logging utility
│   ├── sync.js                 # Main sync script
│   └── cleanup.js              # Cleanup script
├── .env.example                # Environment variables template
├── .gitignore                 # Git ignore rules
├── package.json               # Dependencies and scripts
└── README.md                  # This file
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run sync` | Sync courses from API to HubDB |
| `npm run cleanup` | Delete all rows from HubDB table |

## Data Mapping

The script maps course data to HubDB columns as follows:

| Course API Field | HubDB Column | Transformation |
|-----------------|--------------|----------------|
| `name` | `title` | Direct |
| `short_description` | `short_description` | Direct |
| `vendor.name` | `instructor` | Direct |
| `prices_unformatted.price` | `price` | Default to 0 if missing |
| `lcv_fields_of_study_value` | `fields_of_study` | Array → Comma-separated |
| `lcv_level` | `level` | Direct |
| `lcv_delivery_method` | `delivery_method` | Direct |
| `lcv_length` | `length` | Direct |
| `lcv_total_credits` | `credits` | Divided by 50, formatted |
| `image_url` | `image_url` | Direct |
| `url_key` | `url_key` | Direct (used as unique ID) |
| `vendor.id` | `vendor_id` | Direct |
| `vendor.name` | `vendor_name` | Direct |
| `vendor.logo_src` | `vendor_logo` | Direct |
| `vendor.link` | `vendor_link` | Direct |
| `lcv_program_qualifications_value` | `program_qualifications` | Array → Comma-separated |
| `lcv_total_credits` | `raw_credits` | Raw value |
| `sku` | `sku` | Direct |
| `product_type` | `product_type` | Direct |
| `subs_enabled` | `subscription` | Default to 0 |
| (Generated) | `last_updated` | Current timestamp |
| (Generated) | `status` | Always "Active" |
| (Generated) | `seo_title` | Same as name |
| (Generated) | `seo_description` | Same as short_description |
| (Generated) | `seo_keywords` | Generated from multiple fields |

### Special Transformations

**Credits Calculation:**
```javascript
credits = raw_credits / 50
// Example: 150 → 3
```

**SEO Keywords:**
Generated from: Course name, Vendor name, Fields of study, Level, Delivery method

## Troubleshooting

### Common Issues

**"HUBSPOT_PRIVATE_APP_TOKEN not found"**
- Make sure you've created a `.env` file with your token
- For GitHub Actions, verify the secret is added to repository settings

**"Failed to connect to HubSpot"**
- Verify your token is correct
- Check that the Private App has HubDB permissions
- Ensure the token hasn't been deactivated

**"No courses found"**
- Verify the Course API endpoint is accessible
- Check your network connection
- Review API response format

**Sync runs but no data appears**
- Make sure you're checking the correct table ID
- Verify the table has matching column names
- Check that the table was published after sync

**More courses in HubDB than in the API**
- This is now automatically handled! The sync will delete stale courses
- Check the sync logs for "Deleted" count
- The catalog now stays perfectly in sync with the API source

### Debug Mode

For more verbose logging, you can modify `src/utils/logger.js` to add debug statements.

### Viewing GitHub Actions Logs

1. Go to Actions tab in your repository
2. Click on a workflow run
3. Click on the "sync" job
4. Expand steps to see detailed logs

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for any purpose.

## Support

If you encounter issues:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review GitHub Actions logs
3. Open an issue in the repository

---

**Note:** This script modifies data in your HubSpot account. Always test in a development environment first!

