from flask import Flask, request, jsonify
import sqlite3
from flask_cors import CORS  
from typing import List, Dict, Any

app = Flask(__name__)
CORS(app)

DB_PATH = "articles-1.db"

VALID_JOBS = [
    'Security Engineer',
    'Software Developer',
    'DevOps/SRE',
    'System Administrator',
    'Security Analyst',
    'Other'
]


def get_db():
    """Get database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@app.route('/user', methods=['POST'])
def create_user():
    """
    Create a new user with job and interests.
    
    Request body:
    {
        "job": "Software Developer",
        "interest_ids": [3, 8, 12]
    }
    
    Returns:
    {
        "userId": 1
    }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "Request body is required"}), 400
    
    job = data.get('job')
    interest_ids = data.get('interest_ids', [])
    
    # Validate job
    if not job:
        return jsonify({"error": "job is required"}), 400
    
    if job not in VALID_JOBS:
        return jsonify({"error": f"Invalid job. Must be one of: {', '.join(VALID_JOBS)}"}), 400
    
    # Validate interest_ids
    if not isinstance(interest_ids, list):
        return jsonify({"error": "interest_ids must be a list"}), 400
    
    try:
        conn = get_db()
        cur = conn.cursor()
        
        # Insert user
        cur.execute(
            "INSERT INTO users (job) VALUES (?);",
            (job,)
        )
        user_id = cur.lastrowid
        
        # Insert user interests
        for interest_id in interest_ids:
            try:
                cur.execute(
                    "INSERT INTO user_interests (user_id, interest_id) VALUES (?, ?);",
                    (user_id, interest_id)
                )
            except sqlite3.IntegrityError:
                # Skip invalid interest_id
                pass
        
        conn.commit()
        conn.close()
        
        return jsonify({"userId": user_id}), 201
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/user/<int:user_id>', methods=['GET', 'PATCH'])
def manage_user(user_id: int):
    """
    GET: Get user details by ID.
    PATCH: Update user job and interests.
    
    GET Returns:
    {
        "id": 1,
        "job": "Software Developer",
        "created_at": "2025-11-29 12:00:00",
        "interests": [
            {"id": 3, "name": "Network Security & Firewalls"},
            {"id": 8, "name": "Backend & APIs (Node, Python, Go)"},
            {"id": 12, "name": "Game Development & Graphics"}
        ]
    }
    
    PATCH Request body:
    {
        "job": "Security Engineer",
        "interest_ids": [1, 2, 3, 25, 29]
    }
    
    PATCH Returns:
    {
        "userId": 1
    }
    """
    if request.method == 'GET':
        try:
            conn = get_db()
            cur = conn.cursor()
            
            # Get user
            cur.execute(
                "SELECT id, job, created_at FROM users WHERE id = ?;",
                (user_id,)
            )
            user_row = cur.fetchone()
            
            if not user_row:
                conn.close()
                return jsonify({"error": "User not found"}), 404
            
            user = dict(user_row)
            
            # Get user interests
            cur.execute(
                """
                SELECT i.id, i.name
                FROM interests i
                JOIN user_interests ui ON i.id = ui.interest_id
                WHERE ui.user_id = ?
                ORDER BY i.id;
                """,
                (user_id,)
            )
            
            interests = [dict(row) for row in cur.fetchall()]
            user['interests'] = interests
            
            conn.close()
            
            return jsonify(user), 200
        
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    elif request.method == 'PATCH':
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Request body is required"}), 400
        
        job = data.get('job')
        interest_ids = data.get('interest_ids')
        
        try:
            conn = get_db()
            cur = conn.cursor()
            
            # Check if user exists
            cur.execute("SELECT 1 FROM users WHERE id = ?;", (user_id,))
            if not cur.fetchone():
                conn.close()
                return jsonify({"error": "User not found"}), 404
            
            # Update job if provided
            if job is not None:
                if job not in VALID_JOBS:
                    conn.close()
                    return jsonify({"error": f"Invalid job. Must be one of: {', '.join(VALID_JOBS)}"}), 400
                
                cur.execute(
                    "UPDATE users SET job = ? WHERE id = ?;",
                    (job, user_id)
                )
            
            # Update interests if provided
            if interest_ids is not None:
                if not isinstance(interest_ids, list):
                    conn.close()
                    return jsonify({"error": "interest_ids must be a list"}), 400
                
                # Delete existing interests
                cur.execute("DELETE FROM user_interests WHERE user_id = ?;", (user_id,))
                
                # Insert new interests
                for interest_id in interest_ids:
                    try:
                        cur.execute(
                            "INSERT INTO user_interests (user_id, interest_id) VALUES (?, ?);",
                            (user_id, interest_id)
                        )
                    except sqlite3.IntegrityError:
                        # Skip invalid interest_id
                        pass
            
            conn.commit()
            conn.close()
            
            return jsonify({"userId": user_id}), 200
        
        except Exception as e:
            return jsonify({"error": str(e)}), 500


@app.route('/articles', methods=['GET'])
def get_articles():
    """
    Get suggested articles for a user based on their job and interests.
    
    Query params:
    - userId: int (required)
    - limit: int (optional, default 10)
    
    Returns:
    [
        {
            "id": 1,
            "title": "Article Title",
            "summary": "Three sentence summary...",
            "link": "https://...",
            "category": "Cyber Attack",
            "subcategory": "Ransomware",
            "date": "Nov 24, 2025",
            "imageUrl": "https://...",
            "relevance_score": 85.5,
            "job_score": 75.0,
            "interest_score": 90.0
        }
    ]
    """
    user_id = request.args.get('userId', type=int)
    limit = request.args.get('limit', default=10, type=int)
    
    if not user_id:
        return jsonify({"error": "userId query parameter is required"}), 400
    
    try:
        conn = get_db()
        cur = conn.cursor()
        
        # Check if user exists
        cur.execute("SELECT 1 FROM users WHERE id = ?;", (user_id,))
        if not cur.fetchone():
            conn.close()
            return jsonify({"error": "User not found"}), 404
        
        # Get user's job
        cur.execute("SELECT job FROM users WHERE id = ?;", (user_id,))
        user_job = cur.fetchone()['job']
        
        # Get user's interest IDs
        cur.execute(
            "SELECT interest_id FROM user_interests WHERE user_id = ?;",
            (user_id,)
        )
        user_interest_ids = [row['interest_id'] for row in cur.fetchall()]
        
        # Get articles with scores
        # Calculate relevance score as: job_score * 0.4 + avg(interest_scores) * 0.6
        query = """
        SELECT 
            a.id,
            a.title,
            a.summary,
            a.link,
            a.category,
            a.subcategory,
            a.date,
            a.imageUrl,
            ajs.score as job_score,
            COALESCE(AVG(ais.score), 0) as avg_interest_score,
            (ajs.score * 0.4 + COALESCE(AVG(ais.score), 0) * 0.6) as relevance_score
        FROM articles a
        JOIN article_job_scores ajs ON a.id = ajs.article_id
        LEFT JOIN article_interest_scores ais ON a.id = ais.article_id
        WHERE ajs.job = ?
        """
        
        params = [user_job]
        
        if user_interest_ids:
            placeholders = ','.join('?' * len(user_interest_ids))
            query += f" AND (ais.interest_id IN ({placeholders}) OR ais.interest_id IS NULL)"
            params.extend(user_interest_ids)
        
        query += """
        GROUP BY a.id, a.title, a.summary, a.link, a.category, a.subcategory, a.date, a.imageUrl, ajs.score
        ORDER BY relevance_score DESC
        LIMIT ?;
        """
        params.append(limit)
        
        cur.execute(query, params)
        
        articles = []
        for row in cur.fetchall():
            article = dict(row)
            # Round scores to 2 decimal places
            article['job_score'] = round(article['job_score'], 2)
            article['avg_interest_score'] = round(article['avg_interest_score'], 2)
            article['relevance_score'] = round(article['relevance_score'], 2)
            articles.append(article)
        
        conn.close()
        
        return jsonify(articles), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
