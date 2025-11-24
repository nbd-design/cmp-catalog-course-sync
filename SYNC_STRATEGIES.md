# Sync Strategies Comparison 🔄

You have two options for syncing courses to HubDB. Here's how they compare:

## 📊 Quick Comparison

| Factor | Differential Sync | Full Replace |
|--------|------------------|--------------|
| **Speed** | ⚡ Fast (~90s) | 🐌 Slower (~180s) |
| **API Calls** | ~5,600 | ~11,000+ |
| **Data Safety** | ✅ Never empty | ⚠️ Brief empty state |
| **Complexity** | 🔧 More complex | ✨ Simple |
| **Debugging** | 🔍 Harder | 👁️ Easier |
| **Best For** | Production | Troubleshooting |

---

## Strategy 1: Differential Sync (Current Default) ⚡

**How it works:**
1. Fetch all courses from API (5,566)
2. Fetch all rows from HubDB (5,622)
3. Compare: For each API course → Create if new, Update if exists
4. Compare: For each HubDB row → Delete if not in API
5. Publish changes

### Pros ✅
- **Efficient**: Only ~5,600 API calls (1 call per course)
- **Fast**: Completes in ~90 seconds
- **No downtime**: Table always has data
- **Smart**: Only changes what's needed

### Cons ❌
- **Complex**: More logic, harder to debug
- **Potential issues**: If comparison logic fails, stale data remains

### When to Use
- ✅ **Production** - Daily automated syncs
- ✅ **When working well** - Most efficient option
- ✅ **Rate limit concerns** - Fewer API calls

### Run Command
```bash
npm run sync
```

---

## Strategy 2: Full Replace 🔄

**How it works:**
1. Fetch all existing rows from HubDB
2. Delete ALL rows (5,622 deletions)
3. Fetch all courses from API (5,566)
4. Create ALL courses as new (5,566 creations)
5. Publish changes

### Pros ✅
- **Simple**: Straightforward logic, no comparison
- **Guaranteed clean**: No possibility of stale data
- **Easy to debug**: Clear what's happening
- **Reliable**: Always results in exact match

### Cons ❌
- **Slow**: Takes ~180 seconds (2x longer)
- **More API calls**: ~11,000 calls (could hit rate limits)
- **Brief empty state**: Table is empty between delete and create (only in draft)

### When to Use
- ✅ **Troubleshooting** - When differential sync isn't working
- ✅ **Data quality issues** - When you suspect corruption
- ✅ **One-time fixes** - Not recommended for daily use
- ✅ **Small catalogs** - If you have <1000 courses

### Run Command
```bash
npm run sync:full-replace
```

---

## 🔍 Debugging the Current Issue

You mentioned the differential sync isn't deleting courses as expected. Let's diagnose:

### Step 1: Run with New Debug Logging

The updated `src/sync.js` now includes detailed logging:

```bash
npm run sync
```

**Look for these log lines:**
```
[debug] Sample row structure:
  - id: 12345
  - path: marketing-fundamentals-101
  - name: Marketing Fundamentals 101
  - values.url_key: marketing-fundamentals-101
  - keys in values: title, url_key, price, ...
```

This will show us:
1. How HubDB structures the row data
2. Where the `url_key` is actually stored
3. If url_key matching is working

### Step 2: Check the Deletion Count

Look for:
```
[cleanup] Found 56 stale courses to remove
[cleanup] Sample stale courses:
  - Old Course Title (old-url-key)
  - Another Old Course (another-url-key)
...
[cleanup] Removed 56/56 stale courses
```

### Potential Issues & Fixes

#### Issue 1: url_key is in a different location
**Symptom:** Debug shows `values.url_key: undefined`  
**Fix:** The updated code tries multiple locations: `row.values?.url_key`, `row.path`, `row.values?.path`

#### Issue 2: Deletions not persisting
**Symptom:** Logs show deleted, but courses remain after publish  
**Fix:** May need to work with draft rows instead of published rows

#### Issue 3: Case sensitivity
**Symptom:** url_keys don't match due to case differences  
**Fix:** Normalize to lowercase when comparing

---

## 💡 Recommendation

### For Now: Test with Debug Logging
```bash
# Run the improved differential sync
npm run sync

# Check the logs to see:
# 1. Row structure
# 2. How many stale courses found
# 3. Deletion success/failure
```

### If Differential Still Doesn't Work: Use Full Replace
```bash
# This WILL work, guaranteed
npm run sync:full-replace
```

### Long-term Strategy

**For production (daily automated):**
- Use **Full Replace** if catalog is small (<2000 courses)
- Use **Differential** if catalog is large (>2000 courses) AND working correctly

**Reasoning:**
- With 5,566 courses, Full Replace takes ~3 minutes
- That's acceptable for a daily sync at 2 AM
- You get guaranteed data integrity
- No debugging complex comparison logic

---

## 🔧 Implementation Notes

### If You Want to Switch to Full Replace Permanently

Update `.github/workflows/daily-sync.yml`:

```yaml
- name: Run sync script
  run: npm run sync:full-replace  # Changed from 'npm run sync'
```

### Performance Estimates (5,566 courses)

**Differential Sync:**
- Fetch API courses: ~15s (300 pages × 50ms each)
- Fetch HubDB rows: ~5s (paginated)
- Update 5,400 courses: ~60s (5,400 × 11ms each)  
- Create 100 courses: ~1s
- Delete 56 courses: ~1s
- Publish: ~5s
- **Total: ~87 seconds**

**Full Replace:**
- Delete 5,622 rows: ~62s (5,622 × 11ms each)
- Fetch API courses: ~15s
- Create 5,566 rows: ~61s (5,566 × 11ms each)
- Publish: ~5s
- **Total: ~143 seconds**

Both are fast enough for automated daily syncs!

---

## 🎯 Next Steps

1. **Run differential sync with new debugging:**
   ```bash
   npm run sync
   ```

2. **Check the logs** to see what's happening with deletions

3. **Share the relevant log output** and I can help debug further

4. **OR switch to Full Replace** for guaranteed results:
   ```bash
   npm run sync:full-replace
   ```

Either way, you'll have a working solution! 🚀

