# Email Notification Setup Guide 📧

This guide will help you set up automated email reports for your HubSpot course sync.

## Features

- **Automated email reports** with sync results (total, created, updated, failed)
- **Success/failure notifications** with detailed metrics
- **Direct links** to workflow logs
- **Configurable** - Send always or only on failures

## Setup Options

### Option 1: Gmail (Recommended for Testing)

#### Step 1: Create Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Select **Security** from the left menu
3. Enable **2-Step Verification** (if not already enabled)
4. Search for "App Passwords" or go to https://myaccount.google.com/apppasswords
5. Select **Mail** and **Other (Custom name)** → Name it "HubSpot Sync"
6. Click **Generate**
7. Copy the 16-character password (you'll need this)

#### Step 2: Add GitHub Secrets

Go to your repository → Settings → Secrets and variables → Actions → New repository secret

Add these secrets:

| Secret Name | Value | Example |
|-------------|-------|---------|
| `SMTP_SERVER` | `smtp.gmail.com` | smtp.gmail.com |
| `SMTP_PORT` | `587` | 587 |
| `SMTP_USERNAME` | Your Gmail address | your.email@gmail.com |
| `SMTP_PASSWORD` | App password from Step 1 | abcd efgh ijkl mnop |
| `SMTP_FROM` | Your Gmail address | your.email@gmail.com |
| `NOTIFICATION_EMAIL` | Where to send reports | recipient@example.com |

#### Step 3: Done!

That's it! You'll now receive email reports after **every sync** (both successful and failed) with detailed statistics.

---

### Option 2: SendGrid (Recommended for Production)

SendGrid offers 100 free emails per day.

#### Step 1: Create SendGrid Account

1. Sign up at https://sendgrid.com/
2. Verify your email address
3. Go to Settings → API Keys
4. Click "Create API Key"
5. Name it "HubSpot Course Sync"
6. Select "Restricted Access" → Enable "Mail Send" permission
7. Click "Create & View"
8. Copy the API key

#### Step 2: Add GitHub Secrets

| Secret Name | Value | Example |
|-------------|-------|---------|
| `SMTP_SERVER` | `smtp.sendgrid.net` | smtp.sendgrid.net |
| `SMTP_PORT` | `587` | 587 |
| `SMTP_USERNAME` | `apikey` | apikey (literally) |
| `SMTP_PASSWORD` | Your SendGrid API key | SG.xxxxxxxxxx |
| `SMTP_FROM` | Verified sender email | noreply@yourdomain.com |
| `NOTIFICATION_EMAIL` | Where to send reports | admin@example.com |

**Important:** You must verify the sender email in SendGrid (Settings → Sender Authentication)

---

### Option 3: Microsoft 365 / Outlook

#### Step 1: Get SMTP Credentials

1. Go to https://account.microsoft.com/
2. Select Security → Advanced security options
3. Create an app password for "Mail"
4. Copy the password

#### Step 2: Add GitHub Secrets

| Secret Name | Value | Example |
|-------------|-------|---------|
| `SMTP_SERVER` | `smtp.office365.com` | smtp.office365.com |
| `SMTP_PORT` | `587` | 587 |
| `SMTP_USERNAME` | Your Microsoft email | your.email@outlook.com |
| `SMTP_PASSWORD` | App password | Your app password |
| `SMTP_FROM` | Your Microsoft email | your.email@outlook.com |
| `NOTIFICATION_EMAIL` | Where to send reports | recipient@example.com |

---

### Option 4: Custom SMTP Server

If you have your own SMTP server:

| Secret Name | Value |
|-------------|-------|
| `SMTP_SERVER` | Your SMTP server address |
| `SMTP_PORT` | SMTP port (usually 587 or 465) |
| `SMTP_USERNAME` | SMTP username |
| `SMTP_PASSWORD` | SMTP password |
| `SMTP_FROM` | From email address |
| `NOTIFICATION_EMAIL` | Recipient email |

---

## Email Report Example

You'll receive emails like this:

```
Subject: ✅ HubSpot Course Sync - Success

HubSpot Course Sync Report
==========================================

Status: ✅ SUCCESS
Date: 2025-10-02T02:00:00Z
Workflow Run: https://github.com/youruser/repo/actions/runs/123456

Sync Results:
- Total Courses: 142
- Created: 8
- Updated: 134
- Failed: 0
- Success Rate: 100.0%
- Duration: 45.32s

==========================================

View detailed logs: https://github.com/youruser/repo/actions/runs/123456
```

---

## Configuration Options

### Email Reports

By **default**, you'll receive email reports after **every sync** (both successful and failed) with complete statistics including:
- Total courses processed
- Number created
- Number updated  
- Number failed
- Success rate
- Duration

### Multiple Recipients

To send emails to multiple people, use comma-separated addresses in `NOTIFICATION_EMAIL`:

```
recipient1@example.com, recipient2@example.com, recipient3@example.com
```

### Disable Email Notifications

Simply don't add the SMTP secrets. The workflow will skip the email step if secrets are missing.

---

## Testing

### Test the Email Setup

1. Go to Actions → Daily Course Sync
2. Click "Run workflow"
3. The workflow will run and send an email (if configured)
4. Check your inbox for the report

### Troubleshooting

**"Failed to send email"**
- Verify all SMTP secrets are correct
- Check that SMTP_PORT is a number (587 or 465)
- For Gmail: Make sure you're using an app password, not your regular password
- For SendGrid: Verify your sender email

**"Authentication failed"**
- Double-check SMTP_USERNAME and SMTP_PASSWORD
- For Gmail: Ensure 2FA is enabled and you created an app password
- For SendGrid: Username must be exactly `apikey`

**"Emails not arriving"**
- Check your spam folder
- Verify NOTIFICATION_EMAIL is correct
- For corporate emails: Check with IT about SMTP restrictions

**"Missing metrics in email"**
- The sync might have failed before generating metrics
- Check the workflow logs for errors
- Metrics are only available if the sync script runs

---

## Security Best Practices

✅ **Use App Passwords** - Never use your main account password  
✅ **Use Secrets** - Store credentials in GitHub Secrets, not in code  
✅ **Limit Permissions** - Use minimal SMTP permissions  
✅ **Rotate Regularly** - Change app passwords periodically  
✅ **Monitor Usage** - Check for unauthorized email sends  

---

## GitHub Job Summary

Even without email setup, you'll always see a **beautiful summary** in the GitHub Actions UI:

```
📊 Course Sync Summary
✅ Status: Success

| Metric         | Value  |
|----------------|--------|
| Total Courses  | 142    |
| Created        | 8      |
| Updated        | 134    |
| Failed         | 0      |
| Success Rate   | 100.0% |
| Duration       | 45.32s |
```

This appears automatically after each workflow run!

---

## Advanced: Slack Notifications

Want Slack notifications instead? See [SLACK_SETUP.md](SLACK_SETUP.md) (coming soon!)

---

Need help? Check the [main README](README.md) or open an issue!

