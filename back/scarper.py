import time
import sqlite3
import requests
import argparse
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from pathlib import Path

from scoring import get_all_scores_from_ollama, get_summary_from_ollama

BASE_URL = "https://thehackernews.com"
START_URL = "https://thehackernews.com/search?max-results=120&start=1"
DB_PATH = "articles-1.db"
DDL_PATH = "ddl.sql"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/131.0 Safari/537.36"
    )
}


# ------------------------------------------------------------
#  DB
# ------------------------------------------------------------

def init_db(db_path: str = DB_PATH, ddl_path: str = DDL_PATH):
    # Load SQL from ddl.sql
    ddl_sql = Path(ddl_path).read_text(encoding="utf-8")

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Executes multiple SQL statements in one go
    cur.executescript(ddl_sql)

    conn.commit()
    conn.close()


def link_exists(conn: sqlite3.Connection, link: str) -> bool:
    """Return True if article link already exists in DB."""
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM articles WHERE link = ? LIMIT 1;", (link,))
    return cur.fetchone() is not None


def save_article(conn: sqlite3.Connection, article: dict):
    """
    article dict keys:
      link, title, full_text, category, subcategory, article (bool/int)
    """
    cur = conn.cursor()
    
    # Prepare article text for summary
    title = article["title"]
    full_text = article["full_text"]
    article_text = f"{title}\n\n{full_text}" if title else full_text
    
    # Generate summary using Ollama
    summary = ""
    if article_text and len(article_text.strip()) >= 50:
        print(f"Generating summary...")
        summary = get_summary_from_ollama(article_text)
    
    # Insert article with summary
    cur.execute(
        """
        INSERT OR IGNORE INTO articles
            (link, title, full_text, summary, category, subcategory, article)
        VALUES (?, ?, ?, ?, ?, ?, ?);
        """,
        (
            article["link"],
            article["title"],
            article["full_text"],
            summary,
            article["category"],
            article["subcategory"],
            1 if article["article"] else 0,
        ),
    )
    
    # Get the article_id (either just inserted or existing)
    cur.execute("SELECT id FROM articles WHERE link = ?;", (article["link"],))
    result = cur.fetchone()
    if not result:
        conn.commit()
        return
    
    article_id = result[0]
    
    # Prepare article text for scoring
    article_text = f"{title}\n\n{full_text}" if title else full_text
    
    if article_text and len(article_text.strip()) >= 50:
        # Hardcoded jobs
        jobs = [
            'Security Engineer',
            'Software Developer',
            'DevOps/SRE',
            'System Administrator',
            'Security Analyst',
            'Other'
        ]
        
        # Get all interests from database ordered by id
        cur.execute("SELECT id, name FROM interests ORDER BY id;")
        interests_data = cur.fetchall()
        
        # Create list of interest names in order
        interests = [name for _, name in interests_data]
        
        # Get all scores in one API call
        print(f"Scoring article {article_id}...")
        scores = get_all_scores_from_ollama(article_text, jobs, interests)
        
        # Insert job scores
        for job, score in scores['job_scores'].items():
            cur.execute(
                """
                INSERT OR REPLACE INTO article_job_scores (article_id, job, score)
                VALUES (?, ?, ?);
                """,
                (article_id, job, score)
            )
        
        # Insert interest scores
        for i, score in enumerate(scores['interest_scores']):
            interest_id = interests_data[i][0]  # Get the id from interests_data
            cur.execute(
                """
                INSERT OR REPLACE INTO article_interest_scores (article_id, interest_id, score)
                VALUES (?, ?, ?);
                """,
                (article_id, interest_id, score)
            )
        
        print(f"Finished scoring article {article_id}")
    else:
        print(f"Warning: Article {article_id} has insufficient text for scoring")
    
    conn.commit()


# ------------------------------------------------------------
#  Scraping helpers
# ------------------------------------------------------------

def get_soup(url: str) -> BeautifulSoup:
    resp = requests.get(url, headers=HEADERS, timeout=20)
    resp.raise_for_status()
    return BeautifulSoup(resp.text, "html.parser")


def parse_index_page(url: str):
    """
    Parse one search/index page:
      - return list of article links
      - return next_page_url (or None if no more pages)
    """
    soup = get_soup(url)

    # Articles are in <div class="body-post clear">
    divs = soup.find_all("div", class_="body-post clear")

    links = []
    for div in divs:
        a = div.find("a", href=True)
        if a:
            links.append(urljoin(BASE_URL, a["href"]))

    # Next page button
    next_a = soup.find("a", class_="blog-pager-older-link-mobile")
    if not next_a:
        next_a = soup.find("a", class_="blog-pager-older-link")

    if next_a and next_a.get("href"):
        next_page_url = urljoin(BASE_URL, next_a["href"])
    else:
        next_page_url = None

    return links, next_page_url


def extract_full_text(article_url: str) -> dict:
    soup = get_soup(article_url)

    # Title
    title_tag = soup.find("h1") or soup.find("title")
    title = title_tag.get_text(strip=True) if title_tag else ""

    # Main body candidates
    candidates = [
        ("div", {"class": "articlebody"}),
        ("div", {"class": "articlebody clear"}),
        ("div", {"class": "articlebody clear cf"}),
        ("div", {"id": "articlebody"}),
        ("article", {}),
    ]

    article_node = None
    for tag_name, attrs in candidates:
        node = soup.find(tag_name, attrs=attrs)
        if node:
            article_node = node
            break

    # Fallback: first div after title
    if not article_node and title_tag:
        for sib in title_tag.next_siblings:
            if getattr(sib, "name", None) == "div":
                article_node = sib
                break

    full_text = article_node.get_text(separator="\n", strip=True) if article_node else ""

    # ---- NEW: Category / Subcategory from span.p-tags ----
    category = None
    subcategory = None
    article_flag = False

    tag_span = soup.find("span", class_="p-tags")
    if tag_span:
        raw = tag_span.get_text(strip=True)
        # Expecting "Category / Subcategory"
        parts = [p.strip() for p in raw.split("/") if p.strip()]
        if len(parts) >= 1:
            category = parts[0]
        if len(parts) >= 2:
            subcategory = parts[1]
        article_flag = True   # found tags → article = true
    else:
        article_flag = False  # not found

    return {
        "title": title,
        "link": article_url,
        "full_text": full_text,
        "category": category,
        "subcategory": subcategory,
        "article": article_flag,
    }


# ------------------------------------------------------------
#  Main pagination scraper
# ------------------------------------------------------------

def scrape_all_pages(
    start_url: str = START_URL,
    db_path: str = DB_PATH,
    max_pages: int | None = None,
    until_saved: bool = False,
):
    """
    Follow "Next" links and scrape all pages.

    - start_url: first search page URL
    - max_pages: optional limit. If None -> run until no next page.
    - until_saved: if True, stop completely as soon as we encounter
      an article link that is already in the database.
    """
    init_db(db_path)
    conn = sqlite3.connect(db_path)

    try:
        current_url = start_url
        page_num = 0

        while current_url:
            page_num += 1
            if max_pages is not None and page_num > max_pages:
                print(f"Reached max_pages={max_pages}, stopping.")
                break

            print(f"\n=== Page {page_num}: {current_url} ===")

            article_links, next_page_url = parse_index_page(current_url)
            print(f"Found {len(article_links)} article links")

            for idx, link in enumerate(article_links, start=1):
                print(f"[page {page_num} / {idx}/{len(article_links)}] Checking: {link}")

                if link_exists(conn, link):
                    print(" → Link already in DB.")
                    if until_saved:
                        print(" → --until-saved is set, stopping scraper.")
                        return  # stop everything
                    else:
                        print(" → Skipping and continuing.")
                        continue

                print(" → Scraping article...")
                try:
                    article_data = extract_full_text(link)
                    save_article(conn, article_data)
                except Exception as e:
                    print(f"Error scraping {link}: {e}")

                time.sleep(1)  # polite delay

            # Move to next page
            if next_page_url:
                print(f"Going to next page: {next_page_url}")
            else:
                print("No more pages found. Stopping.")
            current_url = next_page_url

    finally:
        conn.close()

    print("Done.")


# ------------------------------------------------------------
#  CLI
# ------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="TheHackerNews scraper")
    parser.add_argument(
        "--until-saved",
        action="store_true",
        help="Stop scraping when the first already-saved article link is encountered.",
    )
    parser.add_argument(
        "--max-pages",
        type=int,
        default=None,
        help="Optional limit on number of pages to scrape.",
    )
    parser.add_argument(
        "--start-url",
        type=str,
        default=START_URL,
        help="Start URL for scraping (search page).",
    )
    parser.add_argument(
        "--db-path",
        type=str,
        default=DB_PATH,
        help="SQLite DB path.",
    )

    args = parser.parse_args()

    scrape_all_pages(
        start_url=args.start_url,
        db_path=args.db_path,
        max_pages=args.max_pages,
        until_saved=args.until_saved,
    )


if __name__ == "__main__":
    main()

