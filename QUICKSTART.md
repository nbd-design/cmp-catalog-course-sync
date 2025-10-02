# Quick Start Guide 🚀

Get your HubSpot Course Sync up and running in 5 minutes!

## Step 1: Install Dependencies (1 min)

```bash
npm install
```

## Step 2: Configure Environment (1 min)

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your HubSpot Private App token:
```
HUBSPOT_PRIVATE_APP_TOKEN=pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### Where to Get Your Token:
1. Go to HubSpot Settings → Integrations → Private Apps
2. Click "Create a private app"
3. Name it "Course Sync"
4. Enable scope: `cms.hubdb` (Read and Write)
5. Create and copy the token

## Step 3: Test the Sync Locally (2 min)

Run the sync script:

```bash
npm run sync
```

You should see output like:
```
============================================================
🚀 Course Sync to HubDB started
============================================================

[connection] ✓ Successfully connected to HubSpot API
[schema] ✓ Retrieved schema for table 114590372
[api] Fetching courses from API...
[api] Fetched page 1 (20 courses)
...
[create] ✓ [1/100] Created: Introduction to Marketing
[update] ✓ [2/100] Updated: Advanced Python Programming
...
[publish] ✓ Table 114590372 published successfully

============================================================
✅ Process completed
   Total courses: 100
   Created: 45
   Updated: 55
   Failed: 0
   Success rate: 100.0%
   Duration: 34.52s
============================================================
```

## Step 4: Set Up GitHub Actions (1 min)

1. Push this code to your GitHub repository:
   ```bash
   git add .
   git commit -m "Initial commit: HubSpot course sync automation"
   git push origin main
   ```

2. Add your HubSpot token to GitHub Secrets:
   - Go to your repo → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `HUBSPOT_PRIVATE_APP_TOKEN`
   - Value: Your HubSpot token
   - Save

3. The workflow will now run automatically every day at 2 AM UTC!

## Step 5: Test GitHub Actions

Run it manually to verify:
1. Go to Actions tab in your GitHub repository
2. Click "Daily Course Sync"
3. Click "Run workflow" → "Run workflow"
4. Watch it run successfully! ✅
5. Check the **Summary** tab for a beautiful report with metrics!

## Step 6 (Optional): Set Up Email Notifications 📧

Get email reports with sync results!

### Quick Gmail Setup:
1. Create a Gmail App Password at https://myaccount.google.com/apppasswords
2. Add these secrets to GitHub (Settings → Secrets → Actions):
   - `SMTP_SERVER` = `smtp.gmail.com`
   - `SMTP_PORT` = `587`
   - `SMTP_USERNAME` = your Gmail address
   - `SMTP_PASSWORD` = (app password from step 1)
   - `NOTIFICATION_EMAIL` = where to send reports

You'll receive email reports after every sync with detailed stats!

**See [EMAIL_SETUP.md](EMAIL_SETUP.md) for detailed setup instructions!**

## Optional: Clean Up Test Data

If you want to remove all rows from the table:

```bash
npm run cleanup
```

⚠️ **Warning:** This deletes ALL data from the table!

## Troubleshooting

### "HUBSPOT_PRIVATE_APP_TOKEN not found"
- Make sure you created the `.env` file
- Check that the token is on the right line without extra spaces

### "Failed to connect to HubSpot"
- Verify your token is correct (copy it again)
- Make sure the Private App has HubDB permissions enabled

### "No courses found"
- Check your internet connection
- The Course API might be temporarily unavailable

## Next Steps

✅ Sync is working locally  
✅ GitHub Actions is configured  
✅ Daily automation is active  

You're all set! The sync will run automatically every day. Check the GitHub Actions logs to monitor execution.

---

**Need help?** Check the full [README.md](README.md) for detailed documentation.

