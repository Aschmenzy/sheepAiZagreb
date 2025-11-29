#!/usr/bin/env python3
"""
Helper script to test Telegram bot and get chat IDs.

Usage:
1. Run this script: python3 register_telegram_user.py
2. Send a message to your bot in Telegram
3. The script will show your chat ID
4. Use that chat ID to register users in bot.py
"""

import requests
import time
from bot import BOT_TOKEN, register_user

def get_updates():
    """Get recent messages sent to the bot."""
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/getUpdates"
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if data.get("ok"):
            return data.get("result", [])
        else:
            print(f"Error: {data}")
            return []
    except requests.exceptions.RequestException as e:
        print(f"Error getting updates: {e}")
        return []


def main():
    print("="*60)
    print("Telegram Bot - Chat ID Finder")
    print("="*60)
    print()
    print("Instructions:")
    print("1. Open Telegram and find your bot")
    print("2. Send ANY message to the bot (e.g., '/start' or 'hello')")
    print("3. Come back here and press Enter")
    print()
    input("Press Enter after you've sent a message to the bot...")
    print()
    print("Fetching messages...")
    
    updates = get_updates()
    
    if not updates:
        print("❌ No messages found!")
        print()
        print("Troubleshooting:")
        print("- Make sure you sent a message to the bot")
        print("- Check that BOT_TOKEN in bot.py is correct")
        print("- Try sending another message and run this script again")
        return
    
    print(f"✓ Found {len(updates)} message(s)")
    print()
    print("="*60)
    print("Chat IDs Found:")
    print("="*60)
    
    seen_chats = set()
    
    for update in updates:
        message = update.get("message", {})
        chat = message.get("chat", {})
        chat_id = str(chat.get("id", ""))
        chat_type = chat.get("type", "")
        
        if chat_id and chat_id not in seen_chats:
            seen_chats.add(chat_id)
            
            if chat_type == "private":
                first_name = chat.get("first_name", "")
                last_name = chat.get("last_name", "")
                username = chat.get("username", "")
                
                print(f"\n👤 Private Chat")
                print(f"   Name: {first_name} {last_name}".strip())
                if username:
                    print(f"   Username: @{username}")
                print(f"   Chat ID: {chat_id}")
            else:
                title = chat.get("title", "")
                print(f"\n👥 Group Chat: {title}")
                print(f"   Chat ID: {chat_id}")
    
    print()
    print("="*60)
    print("How to Register These Users:")
    print("="*60)
    print()
    print("Add this code to bot.py (after the imports):")
    print()
    
    for chat_id in seen_chats:
        user_id = f"user_{chat_id}"
        print(f'register_user("{user_id}", "{chat_id}")')
    
    print()
    print("Or update scarper.py to register users on startup.")


if __name__ == "__main__":
    main()
