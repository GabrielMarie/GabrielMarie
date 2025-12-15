# EPQ Interest Rate Logger - Quick Start Guide

## What You Have

A complete Python data-logger that:
- **Fetches** official EPQ interest rates from https://epq.gouv.qc.ca/taux-en-vigueur/
- **Extracts** and parses all product rates (progressive bonds, fixed-rate bonds, savings accounts)
- **Stores** data in a clean, append-only CSV file for historical tracking
- **Handles** JavaScript rendering with automatic fallback to Playwright
- **Avoids duplicates** by checking the effective date
- **Logs everything** to `epq_rate.log` for debugging
- **Runs daily** via Windows Task Scheduler (or cron on Linux/Mac)

## Files Included

| File | Purpose |
|------|---------|
| `epq_rate.py` | Main logger script (run daily) |
| `test_epq_logger.py` | Validation & diagnostic tool |
| `run_epq_logger.bat` | Windows batch wrapper for Task Scheduler |
| `setup_task_scheduler.ps1` | PowerShell script to auto-configure Task Scheduler |
| `README_EPQ_RATES.md` | Full documentation with usage examples |
| `epq_taux.csv` | Historical data (created on first run) |
| `epq_rate.log` | Execution logs (created on first run) |

## Quick Start (3 Steps)

### Step 1: Validate Your Setup

```powershell
cd "C:\Users\Gabriel Marie\Documents\GitHub\GabrielMarie\phyton"
python test_epq_logger.py --full
```

This will check:
- All Python packages are installed
- Utility functions work correctly
- CSV file exists (if not first run)
- Can fetch and parse the EPQ page

**Expected output:**
```
✓ All tests passed! Script is ready for production.

To create daily Task Scheduler job, run:
  powershell -ExecutionPolicy Bypass -File setup_task_scheduler.ps1
```

### Step 2: Set Up Daily Scheduling (Windows)

**Option A: Automatic (Recommended)**
```powershell
# Run as Administrator
powershell -ExecutionPolicy Bypass -File setup_task_scheduler.ps1
```

**Option B: Manual (via Task Scheduler UI)**
1. Open **Task Scheduler** (Start → Task Scheduler)
2. Right-click **Task Scheduler Library** → Create Folder → Name: `EPQ_Logger`
3. Right-click the new folder → Create Basic Task
4. **Name:** EPQ Rate Logger
5. **Trigger:** Daily at 9:00 AM (or your preferred time)
6. **Action:**
   - Program: `C:\Users\Gabriel Marie\Documents\GitHub\GabrielMarie\.venv\Scripts\python.exe`
   - Arguments: `epq_rate.py`
   - Start in: `C:\Users\Gabriel Marie\Documents\GitHub\GabrielMarie\phyton`
7. Finish

### Step 3: Test the Task

```powershell
# Run a manual test
powershell -ExecutionPolicy Bypass -File setup_task_scheduler.ps1 -Action Test

# Or run directly
python epq_rate.py
```

Expected output:
```
[INFO] Starting EPQ rate logger...
[INFO] Effective date: 2025-12-15
[INFO] Extracting progressive-rate bonds...
[INFO] Extracted 29 total rate records
[INFO] ✓ Successfully appended 29 rows for 2025-12-15 to epq_taux.csv
```

## Viewing Your Data

### Check Latest Rates
```powershell
python -c "import pandas as pd; df = pd.read_csv('epq_taux.csv'); print(df[df['date_iso'] == df['date_iso'].max()].drop('source_url', 1).to_string())"
```

### View Log File
```powershell
# Latest entries
Get-Content epq_rate.log -Tail 20

# Or open in editor
notepad epq_rate.log
```

### Analyze Data Trends
```python
import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("epq_taux.csv")
df["date_iso"] = pd.to_datetime(df["date_iso"])

# Plot 5-year fixed bond rates over time
fixed_5yr = df[df["product"] == "fixed_rate_bond"][df["term_years"] == 5]
plt.plot(fixed_5yr["date_iso"], fixed_5yr["rate_percent"], marker='o')
plt.title("EPQ 5-Year Fixed Bond Rates")
plt.xlabel("Date")
plt.ylabel("Rate (%)")
plt.grid(True)
plt.show()
```

## CSV Output Example

After first run, `epq_taux.csv` will contain:

```
date_iso,product,term_years,year,rate_percent,scraped_at,source_url,note
2025-12-15,progressive_rate_bond,10,1,3.45,2025-12-15T14:30:00+00:00,https://epq.gouv.qc.ca/taux-en-vigueur/,
2025-12-15,progressive_rate_bond,10,2,3.50,2025-12-15T14:30:00+00:00,https://epq.gouv.qc.ca/taux-en-vigueur/,
2025-12-15,fixed_rate_bond,1,,3.45,2025-12-15T14:30:00+00:00,https://epq.gouv.qc.ca/taux-en-vigueur/,
2025-12-15,fixed_rate_bond,2,,3.50,2025-12-15T14:30:00+00:00,https://epq.gouv.qc.ca/taux-en-vigueur/,
2025-12-15,green_fixed_bond,5,,3.60,2025-12-15T14:30:00+00:00,https://epq.gouv.qc.ca/taux-en-vigueur/,
2025-12-15,flexi_plus_savings,,,2.25,2025-12-15T14:30:00+00:00,https://epq.gouv.qc.ca/taux-en-vigueur/,
2025-12-15,savings_bond,,,2.10,2025-12-15T14:30:00+00:00,https://epq.gouv.qc.ca/taux-en-vigueur/,
```

### Column Meanings

| Column | Meaning |
|--------|---------|
| `date_iso` | Effective date (YYYY-MM-DD) |
| `product` | Product type (see table below) |
| `term_years` | Bond term in years (null for variable rates) |
| `year` | Year in progressive ladder (1–10 for progressive bonds only) |
| `rate_percent` | Interest rate, or null if unavailable |
| `scraped_at` | When the data was fetched |
| `source_url` | EPQ page URL |
| `note` | Extra info (e.g., "currently_unavailable") |

### Product Types

| Product | Description |
|---------|-------------|
| `progressive_rate_bond` | 10-year ladder (rates increase each year) |
| `fixed_rate_bond` | Fixed-rate bonds (terms: 1-10 years) |
| `green_fixed_bond` | Green/eco-friendly 5-year bond |
| `flexi_plus_savings` | Flexible savings account (variable rate) |
| `savings_bond` | Traditional savings bond (may be unavailable) |

## Troubleshooting

### "Module not found" error
```powershell
pip install requests beautifulsoup4 pandas lxml playwright
python -m playwright install chromium
```

### "CSV file is in use" error
- Close any Excel or text editor windows with `epq_taux.csv` open
- Ensure no other Python instance is running

### Task not running
- Check Task Scheduler: Start → taskschd.msc
- Navigate to: Task Scheduler Library → EPQ_Logger → EPQ_Rate_Logger
- Check "Last Result" column (0 = success, non-zero = error)
- Check `epq_rate.log` for error details

### Page structure changed (EPQ modified their website)
EPQ may update their HTML. If the script stops working:
1. Check browser DevTools to see new element IDs
2. Update the corresponding `soup.select_one()` calls in `epq_rate.py`
3. Update table parsing logic if structure changed
4. Run `test_epq_logger.py --full` to validate

## Advanced: Linux/Mac with Cron

On Linux or Mac, add to crontab:

```bash
# Run daily at 9:00 AM
0 9 * * * cd ~/Documents/GitHub/GabrielMarie/phyton && /path/to/venv/bin/python epq_rate.py >> epq_rate.log 2>&1
```

Edit with: `crontab -e`

## Support

- Full documentation: See `README_EPQ_RATES.md`
- Logs: Check `epq_rate.log` for detailed error messages
- Test script: Run `python test_epq_logger.py --help` for diagnostic options

## Notes

- The script is **append-only**: existing data is never deleted or modified
- Duplicate dates are skipped automatically
- Rate extraction is **idempotent**: running multiple times on the same day adds no new rows
- Task Scheduler will retry on failure (configurable in task properties)
- All timestamps are in **UTC** (ISO 8601 format)

Good luck with your EPQ rate tracking!
