# EPQ Taux Logger - Folder Organization

## Current Structure

```
phyton/
└── EPQ_Taux/
    ├── epq_rate.py              ⭐ Main script (run daily)
    ├── epq_taux.csv             📊 Historical rate data
    ├── epq_rate.log             📋 Execution logs
    ├── test_epq_logger.py       🧪 Test & validation tool
    ├── run_epq_logger.bat       ⚙️ Windows Task Scheduler wrapper
    ├── setup_task_scheduler.ps1 🔧 PowerShell setup automation
    │
    └── docs/                    📚 Reference documentation
        ├── 00_START_HERE.md
        ├── README_EPQ_RATES.md
        ├── QUICKSTART.md
        ├── IMPLEMENTATION.md
        ├── SETUP_CHECKLIST.md
        └── DELIVERABLES.md
```

## What Each File Does

### Active Files (Root Level)

| File | Purpose |
|------|---------|
| **epq_rate.py** | Main logger - fetches and parses EPQ rates daily |
| **epq_taux.csv** | Historical data - appends new rates, never overwrites |
| **epq_rate.log** | Execution log - tracks every run (success/errors) |
| **test_epq_logger.py** | Validation tool - tests setup and diagnoses issues |
| **run_epq_logger.bat** | Windows wrapper - called by Task Scheduler |
| **setup_task_scheduler.ps1** | PowerShell automation - sets up daily scheduling |

### Documentation (docs/ folder)

These are references only, kept separate for a clean workspace:
- `00_START_HERE.md` - Project overview
- `README_EPQ_RATES.md` - Full reference manual
- `QUICKSTART.md` - 3-step setup guide
- `IMPLEMENTATION.md` - Technical details
- `SETUP_CHECKLIST.md` - Feature verification
- `DELIVERABLES.md` - Project summary

## Running the Logger

### Manual Run
```powershell
cd "C:\Users\Gabriel Marie\Documents\GitHub\GabrielMarie\phyton\EPQ_Taux"
python epq_rate.py
```

### Test Setup
```powershell
cd "C:\Users\Gabriel Marie\Documents\GitHub\GabrielMarie\phyton\EPQ_Taux"
python test_epq_logger.py --full
```

### Schedule (Windows)
```powershell
cd "C:\Users\Gabriel Marie\Documents\GitHub\GabrielMarie\phyton\EPQ_Taux"
powershell -ExecutionPolicy Bypass -File setup_task_scheduler.ps1
```

## Data Files

**epq_taux.csv** contains:
- `date_iso` - Effective date (YYYY-MM-DD)
- `product` - Product name
- `term_years` - Bond term in years
- `year` - Progressive ladder year (1-10)
- `rate_percent` - Interest rate
- `scraped_at` - When data was fetched
- `source_url` - EPQ page URL
- `note` - Additional info

**epq_rate.log** contains:
- Timestamp of each execution
- Success/failure status
- Rows added
- Any errors encountered

## Cleanup Summary

✅ Removed:
- `test_html_parser.py` (debugging only)

✅ Organized:
- All documentation moved to `docs/` folder
- All data and scripts in root of `EPQ_Taux`
- No unnecessary files in workspace

✅ File count: 12 files total
- 6 active files (root)
- 6 documentation files (docs/)

All files are in **EPQ_Taux/** now - clean and organized!
