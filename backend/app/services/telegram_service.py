"""
Telegram Service - Service untuk mengirim pesan via Telegram Bot
"""
import os
import httpx
from typing import List, Optional
from app.core.logging_config import app_logger
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def get_telegram_bot_token() -> Optional[str]:
    """Get Telegram bot token from environment"""
    return os.getenv("TELEGRAM_BOT_TOKEN")


async def send_telegram_message(
    telegram_id: str,
    message: str,
    title: Optional[str] = None
) -> bool:
    """
    Send message to a specific Telegram user
    
    Args:
        telegram_id: Telegram user ID
        message: Message content
        title: Optional title/header
        
    Returns:
        True if successful, False otherwise
    """
    bot_token = get_telegram_bot_token()
    if not bot_token:
        app_logger.warning("TELEGRAM_BOT_TOKEN not set, cannot send Telegram message")
        return False
    
    # Format message with title if provided
    formatted_message = message
    if title:
        formatted_message = f"🔔 *{title}*\n\n{message}"
    
    telegram_api_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                telegram_api_url,
                json={
                    "chat_id": telegram_id,
                    "text": formatted_message,
                    "parse_mode": "Markdown"
                }
            )
            response.raise_for_status()
            app_logger.info(f"Telegram message sent to {telegram_id}")
            return True
    except httpx.HTTPError as e:
        app_logger.error(f"Failed to send Telegram message to {telegram_id}: {str(e)}")
        return False
    except Exception as e:
        app_logger.error(f"Error sending Telegram message to {telegram_id}: {str(e)}")
        return False


async def send_telegram_broadcast(
    telegram_ids: List[str],
    message: str,
    title: Optional[str] = None
) -> dict:
    """
    Send broadcast message to multiple Telegram users
    
    Args:
        telegram_ids: List of Telegram user IDs
        message: Message content
        title: Optional title/header
        
    Returns:
        Dictionary with success_count and failed_count
    """
    if not telegram_ids:
        return {"success_count": 0, "failed_count": 0, "total": 0}
    
    success_count = 0
    failed_count = 0
    
    for telegram_id in telegram_ids:
        success = await send_telegram_message(telegram_id, message, title)
        if success:
            success_count += 1
        else:
            failed_count += 1
    
    return {
        "success_count": success_count,
        "failed_count": failed_count,
        "total": len(telegram_ids)
    }

