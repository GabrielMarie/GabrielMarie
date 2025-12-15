# EPQ Interest Rate Data Logger

A Python script that automatically fetches and records historical interest rates from [Épargne Placements Québec (EPQ)](https://epq.gouv.qc.ca/taux-en-vigueur/).

## What It Does

- **Fetches official rates** from the EPQ "Rates in effect" page
- **Extracts the effective date** from the page and converts to ISO format (YYYY-MM-DD)
- **Avoids duplicates** by checking if the date already exists in the CSV
- **Records all product types:**
  - Progressive-rate bonds (10-year ladder: years 1–10)
  - Fixed-rate bonds (terms: 1, 2, 3, 4, 5, 6, 10 years)
  - Green fixed-rate bond (5-year)
  - Flexi-Plus savings (flexible rate)
  - Savings bond (may be unavailable)
- **Handles JavaScript rendering** with automatic fallback to Playwright if needed
- **Stores data in clean CSV format** suitable for graphing and analysis
- **Runs daily** via Windows Task Scheduler or cron
- **Logs all activity** to `epq_rate.log` for debugging and monitoring

## Installation

### 1. Install Dependencies

```bash
pip install requests beautifulsoup4 pandas lxml playwright
python -m playwright install
```

### 2. Verify Installation

```bash
python epq_rate.py
```

You should see log messages indicating:
- HTML fetch method (requests or Playwright)
- Date extraction
- Rate extraction for each product type
- CSV storage status

## CSV Output Format

The script creates/appends to `epq_taux.csv` with these columns:

| Column | Type | Notes |
|--------|------|-------|
| `date_iso` | YYYY-MM-DD | Effective date of the rates |
| `product` | string | Product name (e.g., `fixed_rate_bond`, `progressive_rate_bond`) |
| `term_years` | integer | Bond term in years (null for floating-rate products) |
| `year` | integer | Year of progressive ladder (1–10, only for progressive bonds) |
| `rate_percent` | decimal | Interest rate (null if product unavailable) |
| `scraped_at` | ISO 8601 | Timestamp when data was extracted |
| `source_url` | URL | Source page |
| `note` | string | Additional info (e.g., "currently_unavailable") |

### Example CSV Output

```csv
date_iso,product,term_years,year,rate_percent,scraped_at,source_url,note
2025-12-15,progressive_rate_bond,10,1,3.45,2025-12-15T14:30:00+00:00,https://epq.gouv.qc.ca/taux-en-vigueur/,
2025-12-15,progressive_rate_bond,10,2,3.50,2025-12-15T14:30:00+00:00,https://epq.gouv.qc.ca/taux-en-vigueur/,
2025-12-15,progressive_rate_bond,10,3,3.55,2025-12-15T14:30:00+00:00,https://epq.gouv.qc.ca/taux-en-vigueur/,
2025-12-15,fixed_rate_bond,1,,3.45,2025-12-15T14:30:00+00:00,https://epq.gouv.qc.ca/taux-en-vigueur/,
2025-12-15,fixed_rate_bond,2,,3.50,2025-12-15T14:30:00+00:00,https://epq.gouv.qc.ca/taux-en-vigueur/,
2025-12-15,green_fixed_bond,5,,3.60,2025-12-15T14:30:00+00:00,https://epq.gouv.qc.ca/taux-en-vigueur/,
2025-12-15,flexi_plus_savings,,,2.25,2025-12-15T14:30:00+00:00,https://epq.gouv.qc.ca/taux-en-vigueur/,
2025-12-15,savings_bond,,,2.10,2025-12-15T14:30:00+00:00,https://epq.gouv.qc.ca/taux-en-vigueur/,
```

## Daily Scheduling

### Windows: Task Scheduler

1. **Open Task Scheduler** (search "Task Scheduler" in Start menu)

2. **Create Basic Task:**
   - Right-click "Task Scheduler Library" → New Folder → Name: `EPQ_Logger`
   - Right-click → Create Basic Task
   - Name: `EPQ Rate Logger`
   - Description: `Fetch EPQ interest rates daily`

3. **Trigger:** 
   - Choose "Daily"
   - Set time (e.g., 9:00 AM)
   - Repeat every 1 day

4. **Action:**
   - Program/script: `C:\Users\Gabriel Marie\Documents\GitHub\GabrielMarie\.venv\Scripts\python.exe`
   - Arguments: `epq_rate.py`
   - Start in: `C:\Users\Gabriel Marie\Documents\GitHub\GabrielMarie\phyton`

5. **Finish** and test

### Linux/Mac: Cron

Add to crontab (`crontab -e`):

```bash
# Run daily at 9:00 AM
0 9 * * * cd ~/Documents/GitHub/GabrielMarie/phyton && python epq_rate.py >> epq_rate.log 2>&1
```

## Logging

All activity is logged to `epq_rate.log` with timestamps and log levels:

```
2025-12-15 14:30:00,000 [INFO] Starting EPQ rate logger (fetching https://epq.gouv.qc.ca/taux-en-vigueur/)
2025-12-15 14:30:00,100 [INFO] Attempting to fetch page with requests...
2025-12-15 14:30:01,200 [INFO] requests: fetched 45320 chars
2025-12-15 14:30:01,300 [INFO] Page contains required markers, using requests result
2025-12-15 14:30:01,400 [INFO] Effective date: 2025-12-15
2025-12-15 14:30:01,500 [INFO] Extracting progressive-rate bonds...
2025-12-15 14:30:01,600 [DEBUG]   → 10 rates extracted
2025-12-15 14:30:01,700 [INFO] Extracting fixed-rate bonds...
2025-12-15 14:30:01,800 [INFO] Extracted 29 total rate records
2025-12-15 14:30:01,900 [INFO] ✓ Successfully appended 29 rows for 2025-12-15 to epq_taux.csv
```

## Analyzing the Data

### View Latest Rates (PowerShell)

```powershell
python -c "import pandas as pd; df = pd.read_csv('epq_taux.csv'); print(df[df['date_iso'] == df['date_iso'].max()].to_string())"
```

### Plot Rate Trends (Python)

```python
import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("epq_taux.csv")
df["date_iso"] = pd.to_datetime(df["date_iso"])

# Progressive bond rates over time
prog = df[df["product"] == "progressive_rate_bond"]
for year in range(1, 11):
    data = prog[prog["year"] == year]
    plt.plot(data["date_iso"], data["rate_percent"], label=f"Year {year}")

plt.xlabel("Date")
plt.ylabel("Rate (%)")
plt.title("EPQ Progressive Bond Rates")
plt.legend()
plt.show()
```

## Troubleshooting

### "Required markers not found" error

If the script falls back to Playwright, ensure the browser is properly installed:

```bash
python -m playwright install chromium
```

### Page structure changed

If EPQ changes their HTML structure, you may need to:
1. Check the new element IDs in the browser DevTools
2. Update the corresponding `soup.select_one()` calls in the script
3. Update the table extraction logic if the fixed-rate bond table structure changes

### CSV file locked

If running on Windows and getting "file is in use" error:
- Close any Excel or other programs editing the CSV
- Ensure no other script instances are running

## Product Name Reference

| Product | HTML ID | Column Name | Notes |
|---------|---------|-------------|-------|
| Progressive (10yr ladder) | `lblOtpTaux1`–`lblOtpTaux10` | `progressive_rate_bond` | One rate per year (1–10) |
| Fixed-rate bonds | Table anchor `OTF` | `fixed_rate_bond` | Terms: 1, 2, 3, 4, 5, 6, 10 years |
| Green bond | `lblOtfVTaux1` | `green_fixed_bond` | Always 5-year term |
| Flexi-Plus | `lblFlexiTaux1` | `flexi_plus_savings` | Floating rate |
| Savings bond | `lblOeqTaux1` | `savings_bond` | May be unavailable |

## License & Attribution

This script is designed to work with publicly available official EPQ rates.
EPQ is a Quebec government savings service: https://epq.gouv.qc.ca/

## Questions?

Check `epq_rate.log` for detailed execution logs and error messages.
