#!/usr/bin/env python3
"""
EPQ Rate Logger - Validation & Test Script

This script validates the setup and provides diagnostic information.

Usage:
    python test_epq_logger.py [--full] [--dry-run]

Options:
    --full      Run a full fetch attempt (may hit rate limits)
    --dry-run   Don't actually write to CSV, just parse and display results
"""

import sys
import logging
from pathlib import Path
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from phyton.EPQ_Taux.epq_rate import (
    URL, OUT, norm_pct, fr_date_to_iso, get_html, scrape, 
    already_have_date, extract_date_iso
)
from bs4 import BeautifulSoup

# Setup logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)


def test_imports():
    """Check that all required packages are installed."""
    print("\n" + "="*60)
    print("TESTING IMPORTS")
    print("="*60)
    
    required = ["requests", "beautifulsoup4", "pandas", "lxml", "playwright"]
    failed = []
    
    for pkg in required:
        try:
            __import__(pkg.replace("-", "_"))
            print(f"✓ {pkg}")
        except ImportError as e:
            print(f"✗ {pkg}: {e}")
            failed.append(pkg)
    
    if failed:
        print(f"\nERROR: Missing packages: {', '.join(failed)}")
        print("Install with: pip install " + " ".join(failed))
        return False
    
    print("\nAll packages installed successfully!")
    return True


def test_utility_functions():
    """Test basic utility functions."""
    print("\n" + "="*60)
    print("TESTING UTILITY FUNCTIONS")
    print("="*60)
    
    # Test norm_pct
    tests = [
        ("3,45%", 3.45),
        ("4.50", 4.5),
        ("2,10 %", 2.1),
        ("", None),
    ]
    
    print("\nnorm_pct():")
    for input_str, expected in tests:
        result = norm_pct(input_str)
        status = "✓" if result == expected else "✗"
        print(f"  {status} norm_pct({input_str!r}) = {result} (expected {expected})")
    
    # Test fr_date_to_iso
    print("\nfr_date_to_iso():")
    dates = [
        ("15 décembre 2025", "2025-12-15"),
        ("1 janvier 2025", "2025-01-01"),
        ("31 décembre 2025", "2025-12-31"),
    ]
    
    for french, expected in dates:
        try:
            result = fr_date_to_iso(french)
            status = "✓" if result == expected else "✗"
            print(f"  {status} fr_date_to_iso({french!r}) = {result}")
        except Exception as e:
            print(f"  ✗ fr_date_to_iso({french!r}) raised {e}")
    
    return True


def test_csv_file():
    """Check CSV file status."""
    print("\n" + "="*60)
    print("CSV FILE STATUS")
    print("="*60)
    
    if OUT.exists():
        size_kb = OUT.stat().st_size / 1024
        print(f"✓ CSV file exists: {OUT}")
        print(f"  Size: {size_kb:.1f} KB")
        
        # Read and display summary
        try:
            import pandas as pd
            df = pd.read_csv(OUT, dtype={"date_iso": str})
            print(f"  Rows: {len(df)}")
            print(f"  Columns: {', '.join(df.columns)}")
            print(f"  Date range: {df['date_iso'].min()} to {df['date_iso'].max()}")
            print(f"  Products: {df['product'].nunique()}")
            print(f"\n  Latest date ({df['date_iso'].max()}):")
            latest = df[df['date_iso'] == df['date_iso'].max()]
            print(f"    {len(latest)} records")
            print(f"    Products: {', '.join(latest['product'].unique())}")
        except Exception as e:
            print(f"  Error reading CSV: {e}")
    else:
        print(f"CSV file not found: {OUT}")
        print("This is normal for first run.")
    
    return True


def test_fetch(use_playwright=False):
    """Test fetching the EPQ page."""
    print("\n" + "="*60)
    print("TESTING PAGE FETCH")
    print("="*60)
    
    try:
        logger.info("Fetching EPQ page...")
        html = get_html(URL)
        logger.info(f"Successfully fetched {len(html)} characters")
        
        # Parse date
        soup = BeautifulSoup(html, "lxml")
        date_iso = extract_date_iso(soup)
        logger.info(f"Extracted date: {date_iso}")
        
        return True, html, date_iso
    except Exception as e:
        logger.error(f"Failed to fetch page: {e}", exc_info=True)
        return False, None, None


def test_scrape(html, dry_run=False):
    """Test scraping rates from HTML."""
    print("\n" + "="*60)
    print("TESTING DATA EXTRACTION")
    print("="*60)
    
    try:
        rows = scrape(html)
        logger.info(f"Extracted {len(rows)} rate records")
        
        # Group by product
        products = {}
        for row in rows:
            if row.product not in products:
                products[row.product] = []
            products[row.product].append(row)
        
        print("\nExtracted rates by product:")
        for product, product_rows in sorted(products.items()):
            rates = [r for r in product_rows if r.rate_percent is not None]
            print(f"  {product}: {len(rates)} rates")
            if rates:
                avg_rate = sum(r.rate_percent for r in rates) / len(rates)
                print(f"    Average: {avg_rate:.2f}%")
                print(f"    Range: {min(r.rate_percent for r in rates):.2f}% - {max(r.rate_percent for r in rates):.2f}%")
        
        if dry_run:
            print("\n[DRY RUN] Would write to CSV:")
            date_iso = rows[0].date_iso if rows else "?"
            print(f"  Date: {date_iso}")
            print(f"  Total records: {len(rows)}")
        
        return True, rows
    except Exception as e:
        logger.error(f"Failed to extract data: {e}", exc_info=True)
        return False, None


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Test EPQ logger setup")
    parser.add_argument("--full", action="store_true", help="Run full fetch test")
    parser.add_argument("--dry-run", action="store_true", help="Don't write to CSV")
    args = parser.parse_args()
    
    print("\n" + "="*60)
    print("EPQ INTEREST RATE LOGGER - VALIDATION TEST")
    print("="*60)
    print(f"Time: {datetime.now().isoformat()}")
    print(f"Python: {sys.version}")
    print(f"Working directory: {Path.cwd()}")
    print(f"Script location: {Path(__file__).parent}")
    
    # Run tests
    all_pass = True
    
    if not test_imports():
        all_pass = False
        print("\nERROR: Cannot proceed without dependencies.")
        return 1
    
    if not test_utility_functions():
        all_pass = False
    
    if not test_csv_file():
        all_pass = False
    
    if args.full:
        success, html, date_iso = test_fetch()
        if success:
            success, rows = test_scrape(html, dry_run=args.dry_run)
            if success:
                print("\n✓ All tests passed! Script is ready for production.")
            else:
                all_pass = False
                print("\n✗ Scraping test failed.")
        else:
            all_pass = False
            print("\n✗ Fetch test failed.")
    else:
        print("\nSkipping full fetch test (use --full to enable)")
    
    print("\n" + "="*60)
    if all_pass:
        print("SETUP OK - Ready to schedule!")
        print("\nTo create daily Task Scheduler job, run:")
        print("  powershell -ExecutionPolicy Bypass -File setup_task_scheduler.ps1")
        return 0
    else:
        print("SETUP ISSUES DETECTED - Review errors above")
        return 1


if __name__ == "__main__":
    sys.exit(main())
