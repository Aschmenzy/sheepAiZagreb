from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes
import asyncio
import sqlite3

BOT_TOKEN = "8432242692:AAES5VYBtgYvm5mmZchT6HtecGkW-wA53Vk"
DB_PATH = "articles-1.db"

# Store telegram_id -> user_id mapping
USER_CHAT_MAPPING = {}


def load_user_mappings():
    """Load user-telegram mappings from database on startup."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        
        # Check if telegram_mappings table exists
        cur.execute("""
            CREATE TABLE IF NOT EXISTS telegram_mappings (
                user_id INTEGER PRIMARY KEY,
                telegram_id INTEGER NOT NULL UNIQUE,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        """)
        
        # Load existing mappings
        cur.execute("SELECT user_id, telegram_id FROM telegram_mappings;")
        mapping = {}
        for user_id, telegram_id in cur.fetchall():
            mapping[user_id] = telegram_id
        
        conn.commit()
        conn.close()
        print(f"Loaded {len(mapping)} user mappings from database")
        return mapping
    except Exception as e:
        print(f"Error loading user mappings: {e}")


def save_user_mapping(user_id: int, telegram_id: int):
    """Save user-telegram mapping to database."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        
        cur.execute("""
            INSERT OR REPLACE INTO telegram_mappings (user_id, telegram_id)
            VALUES (?, ?);
        """, (user_id, telegram_id))
        
        conn.commit()
        conn.close()
        
        USER_CHAT_MAPPING[user_id] = telegram_id
        print(f"Saved mapping: user_id={user_id} -> telegram_id={telegram_id}")
    except Exception as e:
        print(f"Error saving user mapping: {e}")


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    internal_id = context.args[0] if context.args else None
    telegram_id = update.effective_user.id

    if internal_id:
        try:
            user_id = int(internal_id)
            save_user_mapping(user_id, telegram_id)
            await update.message.reply_text(
                f"✓ Registered!\n"
                f"Internal userId: {user_id}\n"
                f"Telegram userId: {telegram_id}\n\n"
                f"You'll now receive notifications for new articles!"
            )
        except ValueError:
            await update.message.reply_text("Error: Invalid user ID provided.")
    else:
        await update.message.reply_text(
            "Hello! To register for notifications, use:\n"
            "/start YOUR_USER_ID\n\n"
            f"Your Telegram ID is: {telegram_id}"
        )


def notify_new_article(link: str, title: str, summary: str):
    """
    Send notification about a new article to all registered users.
    This is called synchronously from the scraper.
    """

    USER_CHAT_MAPPING = load_user_mappings()
    if not USER_CHAT_MAPPING:
        print("No users registered for notifications")
        return
    
    # Format the message
    message = f"""
🆕 <b>New Article Alert!</b>

<b>{title}</b>

{summary}

🔗 <a href="{link}">Read more</a>
""".strip()
    
    print(f"\n=== Sending Telegram notifications to {len(USER_CHAT_MAPPING)} users ===")
    
    # Send synchronously using requests (simpler than async in scraper context)
    import requests
    
    success_count = 0
    for user_id, telegram_id in USER_CHAT_MAPPING.items():
        try:
            url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
            payload = {
                "chat_id": telegram_id,
                "text": message,
                "parse_mode": "HTML",
                "disable_web_page_preview": False,
            }
            
            response = requests.post(url, json=payload, timeout=10)
            response.raise_for_status()
            print(f"✓ Sent to user {user_id} (telegram_id={telegram_id})")
            success_count += 1
        except Exception as e:
            print(f"✗ Failed to send to user {user_id}: {e}")
    
    print(f"Notifications sent: {success_count}/{len(USER_CHAT_MAPPING)}")


def main():
    USER_CHAT_MAPPING = load_user_mappings()
    
    app = ApplicationBuilder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    
    print("Bot running...")
    print(f"Current registered users: {len(USER_CHAT_MAPPING)}")
    print("\nTo register a user, send them this link:")
    print(f"https://t.me/YOUR_BOT_USERNAME?start=USER_ID")
    print("\nPress Ctrl+C to stop")
    
    app.run_polling()

if __name__ == "__main__":
    main()
