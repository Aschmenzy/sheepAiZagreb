import sqlite3
import requests
import json
import re


OLLAMA_API_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3.1:8b"  # Change this to your preferred model


def get_summary_from_ollama(article_text: str) -> str:
    """
    Generate a three-sentence summary of the article using Ollama.
    
    Args:
        article_text: Full text of the article
    
    Returns:
        Three-sentence summary
    """
    prompt = f"""Summarize the following article in exactly three sentences. Be concise and capture the main points.

Article text:
{article_text[:4000]}

Provide ONLY the one-sentence summary, nothing else."""
    
    print("\n" + "="*80)
    print("SUMMARY PROMPT:")
    print("="*80)
    print(prompt[:500] + "..." if len(prompt) > 500 else prompt)
    print("="*80 + "\n")
    
    try:
        response = requests.post(
            OLLAMA_API_URL,
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.5,
                }
            },
            timeout=60
        )
        response.raise_for_status()
        
        result = response.json()
        summary = result.get("response", "").strip()
        
        print("\n" + "="*80)
        print("SUMMARY OUTPUT:")
        print("="*80)
        print(summary)
        print("="*80 + "\n")
        
        return summary
            
    except Exception as e:
        print(f"Error getting summary from Ollama: {e}")
        return ""


def get_all_scores_from_ollama(article_text: str, jobs: list, interests: list) -> dict:
    """
    Send article text with all jobs and interests to Ollama and get all relevance scores in one call.
    
    Args:
        article_text: Full text of the article
        jobs: List of job titles
        interests: List of interest names (ordered by ID)
    
    Returns:
        Dictionary with 'job_scores' (dict) and 'interest_scores' (list)
    """
    # Build the jobs list for the prompt
    jobs_list = "\n".join([f"{i+1}. {job}" for i, job in enumerate(jobs)])
    
    # Build the interests list for the prompt
    interests_list = "\n".join([f"{i+1}. {name}" for i, name in enumerate(interests)])
    
    prompt = f"""You are an expert content analyzer. Rate how relevant this article is for different job roles and interests.

Article text:
{article_text[:3000]}

Please rate the relevance of this article for each of the following:

JOB ROLES:
    'Security Engineer',
    'Software Developer',
    'DevOps/SRE',
    'System Administrator',
    'Security Analyst',
    'Other'

INTERESTS:
    'Vulnerability Research & Exploit Development',
    'Application Security & Secure Coding',
    'Network Security & Firewalls',
    'Cloud Security (AWS, Azure, GCP)',
    'Identity & Access Management',
    'Mobile Security & IoT',
    'Frontend Frameworks (React, Vue, Angular)',
    'Backend & APIs (Node, Python, Go)',
    'Databases & Data Engineering',
    'AI/ML & Machine Learning Tools',
    'Mobile Development (iOS, Android, Flutter)',
    'Game Development & Graphics',
    'Containers & Orchestration (Docker, K8s)',
    'CI/CD & Automation Pipelines',
    'Cloud Infrastructure (AWS, Azure, GCP)',
    'Monitoring & Observability',
    'Infrastructure as Code (Terraform, Ansible)',
    'Performance & Site Reliability',
    'Linux Administration & Shell Scripting',
    'Windows Server & Active Directory',
    'Networking & DNS Management',
    'Storage & Backup Solutions',
    'Virtualization (VMware, Hyper-V)',
    'Automation & Configuration Management',
    'Threat Intelligence & Threat Hunting',
    'Incident Response & Forensics',
    'Security Operations & SIEM',
    'Malware Analysis & Reverse Engineering',
    'Penetration Testing & Red Teaming',
    'Compliance & Risk Management',
    'Cybersecurity & Privacy',
    'Software Development & Programming',
    'Cloud & Infrastructure',
    'AI & Machine Learning',
    'Data Science & Analytics',
    'Web Technologies & Frameworks'

Provide a score from 0 to 100 for EACH item, where:
- 0 means completely irrelevant
- 100 means extremely relevant and important

Respond in the following format (ONLY numbers, one per line):
JOB_SCORES: score1,score2,score3,score4,score5,score6
INTEREST_SCORES: score1,score2,score3,...

Example response:
JOB_SCORES: 85,45,60,30,90,20
INTEREST_SCORES: 80,50,40,70,60,55,30,25,85,75,65,45"""
    
    print("\n" + "="*80)
    print("INPUT PROMPT:")
    print("="*80)
    print(prompt)
    print("="*80 + "\n")
    
    try:
        response = requests.post(
            OLLAMA_API_URL,
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.3,  # Lower temperature for more consistent scoring
                }
            },
            timeout=120
        )
        response.raise_for_status()
        
        result = response.json()
        response_text = result.get("response", "").strip()
        
        print("\n" + "="*80)
        print("OLLAMA OUTPUT:")
        print("="*80)
        print(response_text)
        print("="*80 + "\n")
        
        # Parse the response
        job_scores = {}
        interest_scores = []
        
        # Extract job scores
        job_match = re.search(r'JOB_SCORES:\s*([\d,.\s]+)', response_text, re.IGNORECASE)
        if job_match:
            scores_str = job_match.group(1).strip()
            scores = [float(s.strip()) for s in scores_str.split(',') if s.strip()]
            for i, job in enumerate(jobs):
                if i < len(scores):
                    job_scores[job] = max(0.0, min(100.0, scores[i]))
                else:
                    job_scores[job] = 0.0
        else:
            print(f"Warning: Could not parse job scores from response")
            job_scores = {job: 0.0 for job in jobs}
        
        # Extract interest scores
        interest_match = re.search(r'INTEREST_SCORES:\s*([\d,.\s]+)', response_text, re.IGNORECASE)
        if interest_match:
            scores_str = interest_match.group(1).strip()
            scores = [float(s.strip()) for s in scores_str.split(',') if s.strip()]
            # Pad or truncate to match interests length
            for i in range(len(interests)):
                if i < len(scores):
                    interest_scores.append(max(0.0, min(100.0, scores[i])))
                else:
                    interest_scores.append(0.0)
        else:
            print(f"Warning: Could not parse interest scores from response")
            interest_scores = [0.0] * len(interests)
        
        return {
            'job_scores': job_scores,
            'interest_scores': interest_scores
        }
            
    except Exception as e:
        print(f"Error getting scores from Ollama: {e}")
        return {
            'job_scores': {job: 0.0 for job in jobs},
            'interest_scores': [0.0] * len(interests)
        }


def update_article_scores(conn: sqlite3.Connection, article_id: int):
    """
    Update article_job_scores and article_interest_scores for a given article.
    Uses Ollama to generate real relevance scores with a single API call.
    
    Args:
        conn: SQLite database connection
        article_id: ID of the article to score
    """
    cur = conn.cursor()
    
    # Get article text
    cur.execute("SELECT title, full_text FROM articles WHERE id = ?;", (article_id,))
    result = cur.fetchone()
    if not result:
        print(f"Warning: Article {article_id} not found")
        return
    
    title, full_text = result
    article_text = f"{title}\n\n{full_text}" if title else full_text
    
    if not article_text or len(article_text.strip()) < 50:
        print(f"Warning: Article {article_id} has insufficient text for scoring")
        return
    
    # Get all jobs
    jobs = [
        'Security Engineer',
        'Software Developer',
        'DevOps/SRE',
        'System Administrator',
        'Security Analyst',
        'Other'
    ]
    
    # Get all interests with their names
    cur.execute("SELECT id, name FROM interests;")
    interests = cur.fetchall()
    
    # Get all scores in one API call
    print(f"Scoring article {article_id}...")
    scores = get_all_scores_from_ollama(article_text, jobs, interests)
    
    # Insert job scores
    print(f"  Job scores:")
    for job, score in scores['job_scores'].items():
        print(f"    {job}: {score}")
        cur.execute(
            """
            INSERT OR REPLACE INTO article_job_scores (article_id, job, score)
            VALUES (?, ?, ?);
            """,
            (article_id, job, score)
        )
    
    # Insert interest scores
    print(f"  Interest scores:")
    for interest_id, score in scores['interest_scores'].items():
        # Get interest name for display
        interest_name = next((name for id_, name in interests if id_ == interest_id), f"ID {interest_id}")
        print(f"    {interest_name}: {score}")
        cur.execute(
            """
            INSERT OR REPLACE INTO article_interest_scores (article_id, interest_id, score)
            VALUES (?, ?, ?);
            """,
            (article_id, interest_id, score)
        )
    
    conn.commit()
    print(f"Finished scoring article {article_id}")
