# pip install requests beautifulsoup4 pandas lxml
# pip install requests beautifulsoup4 lxml
# pip install playwright pandas
# python -m playwright install

"""
EPQ Interest Rate Data Logger

Fetches official interest rates from Épargne Placements Québec (EPQ)
and maintains a historical CSV dataset.

Usage:
    python epq_rate.py
    
The script can be scheduled to run daily via Task Scheduler (Windows) or cron (Linux/Mac).
"""

from __future__ import annotations

import csv
import logging
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Iterable

import pandas as pd
import requests
from bs4 import BeautifulSoup

from playwright.sync_api import sync_playwright

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(Path(__file__).parent / "epq_rate.log", encoding="utf-8"),
    ]
)
logger = logging.getLogger(__name__)


URL = "https://epq.gouv.qc.ca/taux-en-vigueur/"
# Store CSV in the same folder as the script (not in current working directory)
SCRIPT_DIR = Path(__file__).parent
OUT = SCRIPT_DIR / "epq_taux.csv"


# ------------------ utils ------------------

def norm_space(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()

def norm_pct(s: str) -> Optional[float]:
    if not s:
        return None
    s = s.replace("\xa0", " ").strip().replace(",", ".")
    m = re.search(r"[-+]?\d+(?:\.\d+)?", s)
    return float(m.group(0)) if m else None

def fetch_html_requests(url: str) -> Optional[str]:
    """Fetch HTML using requests library (fast but may not execute JS)."""
    try:
        r = requests.get(url, timeout=30, headers={"User-Agent": "Mozilla/5.0"})
        r.raise_for_status()
        logger.info(f"requests: fetched {len(r.text)} chars")
        return r.text
    except Exception as e:
        logger.warning(f"requests failed: {e}")
        return None

def fetch_html_playwright(url: str) -> Optional[str]:
    """Fetch HTML using Playwright (slower but executes JS)."""
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(url, wait_until="load")
            # Wait for Vue to render by waiting for specific rate elements
            try:
                page.wait_for_selector("span[id^='lblOtpTaux']", timeout=5000)
            except:
                logger.warning("Timeout waiting for Vue elements, using partial HTML")
            html = page.content()
            browser.close()
            logger.info(f"playwright: fetched {len(html)} chars after JS rendering")
            return html
    except Exception as e:
        logger.error(f"playwright failed: {e}")
        return None

def get_html(url: str) -> str:
    """
    Try requests (fast) first. If it contains Vue.js templates, 
    fall back to Playwright for JavaScript rendering.
    
    Raises RuntimeError if both methods fail.
    """
    logger.info("Attempting to fetch page with requests...")
    html = fetch_html_requests(url)
    
    # Check if page has Vue.js templates (not rendered)
    if html and "{{json.produits" in html:
        logger.info("Page contains Vue.js templates, needs JavaScript rendering - using Playwright...")
        html = fetch_html_playwright(url)
        if not html:
            raise RuntimeError("Playwright failed to fetch the page")
        return html
    
    if html and "lblDateModifTaux" in html:
        logger.info("Page is rendered, using requests result")
        return html
    
    logger.info("Page not fully loaded, falling back to Playwright...")
    html = fetch_html_playwright(url)
    
    if not html:
        raise RuntimeError("Both requests and Playwright failed to fetch the page")
    
    return html


# ------------------ extraction ------------------

def extract_date_iso(soup: BeautifulSoup) -> str:
    """Extract the effective date and convert to ISO format (YYYY-MM-DD)."""
    # Case 1: Direct ID lookup in rendered HTML
    span = soup.select_one("#lblDateModifTaux")
    if span and span.get_text(strip=True):
        fr = span.get_text(" ", strip=True)
        logger.debug(f"Found date via lblDateModifTaux: {fr!r}")
        return fr_date_to_iso(fr)

    # Case 2: Fallback to text search "Taux en vigueur depuis le ..."
    text = soup.get_text("\n")
    m = re.search(r"Taux\s+en\s+vigueur\s+depuis\s+le\s+([^\n\r]+)", text, flags=re.IGNORECASE)
    if m:
        fr = norm_space(m.group(1))
        logger.debug(f"Found date via text pattern: {fr!r}")
        return fr_date_to_iso(fr)

    raise RuntimeError("Could not extract effective date from page")


def fr_date_to_iso(fr: str) -> str:
    """
    Convert French date string to ISO format (YYYY-MM-DD).
    
    Examples:
        "12 décembre 2025" -> "2025-12-12"
        "1 janvier 2025" -> "2025-01-01"
    """
    fr = fr.strip()
    mois = {
        "janvier": 1, "février": 2, "fevrier": 2, "mars": 3, "avril": 4, "mai": 5,
        "juin": 6, "juillet": 7, "août": 8, "aout": 8, "septembre": 9,
        "octobre": 10, "novembre": 11, "décembre": 12, "decembre": 12,
    }
    m = re.match(r"^\s*(\d{1,2})\s+([A-Za-zéèêëàâîïôöùûç]+)\s+(\d{4})\s*$", fr, re.I)
    if not m:
        raise RuntimeError(f"Unexpected French date format: {fr!r}")
    
    day = int(m.group(1))
    month_str = m.group(2).lower()
    year = int(m.group(3))
    
    if month_str not in mois:
        raise RuntimeError(f"Unknown month: {month_str!r}")
    
    month = mois[month_str]
    return datetime(year, month, day).date().isoformat()


@dataclass(frozen=True)
class RateRow:
    date_iso: str
    product: str
    term_years: Optional[int]
    year: Optional[int]
    rate_percent: Optional[float]
    scraped_at: str
    source_url: str
    note: str = ""


def already_have_date(csv_path: Path, date_iso: str) -> bool:
    """Check if the given date already exists in the CSV file."""
    if not csv_path.exists():
        return False
    try:
        df = pd.read_csv(csv_path, dtype={"date_iso": str})
        exists = (df["date_iso"] == date_iso).any()
        if exists:
            logger.info(f"Date {date_iso} already exists in {csv_path}")
        return exists
    except Exception as e:
        logger.error(f"Error reading CSV: {e}")
        return False


def append_rows(csv_path: Path, rows: Iterable[RateRow]) -> None:
    """Append rate rows to CSV file (create if new)."""
    is_new = not csv_path.exists()
    rows_list = list(rows)  # Consume iterable to count
    
    with csv_path.open("a", newline="", encoding="utf-8") as f:
        fieldnames = ["date_iso", "product", "term_years", "year", "rate_percent", "scraped_at", "source_url", "note"]
        w = csv.DictWriter(f, fieldnames=fieldnames)
        
        if is_new:
            w.writeheader()
            logger.info(f"Created new CSV file: {csv_path}")
        
        for r in rows_list:
            w.writerow({
                "date_iso": r.date_iso,
                "product": r.product,
                "term_years": "" if r.term_years is None else r.term_years,
                "year": "" if r.year is None else r.year,
                "rate_percent": "" if r.rate_percent is None else f"{r.rate_percent:.2f}",
                "scraped_at": r.scraped_at,
                "source_url": r.source_url,
                "note": r.note,
            })
    
    logger.info(f"Appended {len(rows_list)} rows to {csv_path}")


def scrape(html: str) -> list[RateRow]:
    soup = BeautifulSoup(html, "lxml")
    date_iso = extract_date_iso(soup)
    scraped_at = datetime.now(timezone.utc).isoformat(timespec="seconds")

    rows: list[RateRow] = []

    # ---- progressif: lblOtpTaux1..10
    for k in range(1, 11):
        el = soup.select_one(f"#lblOtpTaux{k}")
        rate = norm_pct(el.get_text(strip=True) if el else "")
        rows.append(RateRow(date_iso, "taux_progressif", 10, k, rate, scraped_at, URL))

    # ---- vert: lblOtfVTaux1 (terme 5 ans)
    el = soup.select_one("#lblOtfVTaux1")
    rows.append(RateRow(date_iso, "taux_vert", 5, None, norm_pct(el.get_text(strip=True) if el else ""), scraped_at, URL))

    # ---- flexi: lblFlexiTaux1
    el = soup.select_one("#lblFlexiTaux1")
    rows.append(RateRow(date_iso, "flexi_plus", None, None, norm_pct(el.get_text(strip=True) if el else ""), scraped_at, URL))

    # ---- obligation d'épargne: lblOeqTaux1
    el = soup.select_one("#lblOeqTaux1")
    note = ""
    if soup.find(string=re.compile(r"ne\s+sont\s+pas\s+en\s+vente\s+actuellement", re.I)):
        note = "pas_en_vente_actuellement"
    rows.append(RateRow(date_iso, "obligation_epargne", None, None, norm_pct(el.get_text(strip=True) if el else ""), scraped_at, URL, note=note))

    # ---- taux fixe: table ancrée OTF (on lit “Terme …” puis “Taux annuel (%)”)
    otf_anchor = soup.find("a", attrs={"name": "OTF"})
    if otf_anchor:
        table = otf_anchor.find_parent("table")
        if table:
            trs = table.find_all("tr")
            term_years: list[int] = []
            for tr in trs:
                if re.search(r"\bTerme\b", tr.get_text(" ", strip=True), re.I):
                    nums = re.findall(r"\b(\d{1,2})\b", tr.get_text(" ", strip=True))
                    term_years = [int(n) for n in nums]
                    break

            for tr in trs:
                if re.search(r"taux\s+annuel", tr.get_text(" ", strip=True), re.I):
                    tds = tr.find_all("td")[1:]  # skip label
                    vals = [norm_pct(td.get_text(" ", strip=True)) for td in tds]
                    n = min(len(term_years), len(vals))
                    for i in range(n):
                        rows.append(RateRow(date_iso, "taux_fixe", term_years[i], None, vals[i], scraped_at, URL))
                    break

    return rows


def main():
    """Main entry point: fetch rates and store in CSV."""
    try:
        logger.info(f"Starting EPQ rate logger (fetching {URL})")
        html = get_html(URL)
        
        soup = BeautifulSoup(html, "lxml")
        date_iso = extract_date_iso(soup)
        logger.info(f"Effective date: {date_iso}")

        if already_have_date(OUT, date_iso):
            logger.info(f"No action needed: {date_iso} already in {OUT}")
            return

        rows = scrape(html)
        append_rows(OUT, rows)
        logger.info(f"✓ Successfully appended {len(rows)} rows for {date_iso} to {OUT}")
        
    except Exception as e:
        logger.error(f"Failed to fetch/store rates: {e}", exc_info=True)
        raise


if __name__ == "__main__":
    main()
