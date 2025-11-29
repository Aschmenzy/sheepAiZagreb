import requests
import json

API_BASE_URL = "http://localhost:5000"


def create_user(job: str, interest_ids: list) -> int:
    """Create a new user and return the user ID."""
    url = f"{API_BASE_URL}/user"
    payload = {
        "job": job,
        "interest_ids": interest_ids
    }
    
    print(f"\n=== Creating User ===")
    print(f"POST {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    response = requests.post(url, json=payload)
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 201:
        user_id = response.json()['userId']
        print(f"\n✓ User created successfully with ID: {user_id}")
        return user_id
    else:
        print(f"\n✗ Failed to create user")
        return None


def get_user(user_id: int):
    """Get user details."""
    url = f"{API_BASE_URL}/user/{user_id}"
    
    print(f"\n=== Getting User Details ===")
    print(f"GET {url}")
    
    response = requests.get(url)
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print(f"\n✓ User retrieved successfully")
    else:
        print(f"\n✗ Failed to get user")


def update_user(user_id: int, job: str = None, interest_ids: list = None) -> int:
    """Update user job and/or interests."""
    url = f"{API_BASE_URL}/user/{user_id}"
    payload = {}
    
    if job is not None:
        payload["job"] = job
    if interest_ids is not None:
        payload["interest_ids"] = interest_ids
    
    print(f"\n=== Updating User ===")
    print(f"PATCH {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    response = requests.patch(url, json=payload)
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        user_id = response.json()['userId']
        print(f"\n✓ User updated successfully with ID: {user_id}")
        return user_id
    else:
        print(f"\n✗ Failed to update user")
        return None


def get_articles(user_id: int, limit: int = 10):
    """Get suggested articles for a user."""
    url = f"{API_BASE_URL}/articles"
    params = {
        "userId": user_id,
        "limit": limit
    }
    
    print(f"\n=== Getting Articles ===")
    print(f"GET {url}")
    print(f"Params: {params}")
    
    response = requests.get(url, params=params)
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        articles = response.json()
        print(f"\n✓ Retrieved {len(articles)} articles")
        print(f"\nTop Articles:")
        for i, article in enumerate(articles[:5], 1):
            print(f"\n{i}. {article['title']}")
            print(f"   Link: {article['link']}")
            print(f"   Category: {article.get('category', 'N/A')} / {article.get('subcategory', 'N/A')}")
            print(f"   Relevance Score: {article['relevance_score']}")
            print(f"   Job Score: {article['job_score']}")
            print(f"   Interest Score: {article['avg_interest_score']}")
            if article.get('summary'):
                print(f"   Summary: {article['summary'][:150]}...")
    else:
        print(f"\n✗ Failed to get articles")
        print(f"Response: {json.dumps(response.json(), indent=2)}")


def main():
    print("="*80)
    print("API Client Demo")
    print("="*80)
    
    # Example 1: Security Engineer
    print("\n" + "="*80)
    print("Example 1: Security Engineer")
    print("="*80)
    
    user_id = create_user(
        job="Security Engineer",
        interest_ids=[1, 2, 3, 25, 29, 31]  # Security-related interests
    )
    
    if user_id:
        get_user(user_id)
        get_articles(user_id, limit=5)
    
    # Example 2: Software Developer
    print("\n" + "="*80)
    print("Example 2: Software Developer")
    print("="*80)
    
    user_id = create_user(
        job="Software Developer",
        interest_ids=[7, 8, 9, 10, 32]  # Development-related interests
    )
    
    if user_id:
        get_user(user_id)
        get_articles(user_id, limit=5)
    
    # Example 3: DevOps/SRE
    print("\n" + "="*80)
    print("Example 3: DevOps/SRE")
    print("="*80)
    
    user_id = create_user(
        job="DevOps/SRE",
        interest_ids=[13, 14, 15, 16, 17, 18, 33]  # DevOps-related interests
    )
    
    if user_id:
        get_user(user_id)
        get_articles(user_id, limit=5)
    
    # Example 4: Update a user
    print("\n" + "="*80)
    print("Example 4: Update User")
    print("="*80)
    
    if user_id:
        print("\nBefore update:")
        get_user(user_id)
        
        print("\nUpdating job and interests...")
        update_user(
            user_id=user_id,
            job="Security Analyst",
            interest_ids=[25, 26, 27, 28, 29, 30, 31]  # Security Analyst interests
        )
        
        print("\nAfter update:")
        get_user(user_id)
        get_articles(user_id, limit=5)


if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("\n✗ Error: Could not connect to API server.")
        print("Make sure the API server is running: python3 api.py")
    except Exception as e:
        print(f"\n✗ Error: {e}")
