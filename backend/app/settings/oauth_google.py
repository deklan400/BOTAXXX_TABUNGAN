import httpx
from typing import Dict
from app.core.config import settings
from app.core.logging_config import app_logger


def get_google_oauth_url() -> str:
    """Generate Google OAuth authorization URL"""
    if not settings.GOOGLE_CLIENT_ID:
        raise ValueError("GOOGLE_CLIENT_ID not configured. Please set GOOGLE_CLIENT_ID in .env file.")
    
    if not settings.GOOGLE_REDIRECT_URI:
        raise ValueError("GOOGLE_REDIRECT_URI not configured. Please set GOOGLE_REDIRECT_URI in .env file.")

    from urllib.parse import urlencode
    
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "online",
        "prompt": "select_account",
    }

    query_string = urlencode(params)
    return f"https://accounts.google.com/o/oauth2/v2/auth?{query_string}"


async def get_google_user_info(code: str) -> Dict[str, str]:
    """Exchange authorization code for user info"""
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise ValueError("Google OAuth not configured")

    # Exchange code for token
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
    }

    async with httpx.AsyncClient() as client:
        try:
            token_response = await client.post(token_url, data=token_data)
            token_response.raise_for_status()
            token_json = token_response.json()
            access_token = token_json["access_token"]
        except Exception as e:
            app_logger.error(f"Failed to exchange code for token: {str(e)}")
            raise

        # Get user info
        userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        headers = {"Authorization": f"Bearer {access_token}"}

        try:
            userinfo_response = await client.get(userinfo_url, headers=headers)
            userinfo_response.raise_for_status()
            userinfo = userinfo_response.json()
            return {
                "id": userinfo["id"],
                "email": userinfo["email"],
                "name": userinfo.get("name", userinfo["email"]),
                "picture": userinfo.get("picture"),
            }
        except Exception as e:
            app_logger.error(f"Failed to get user info: {str(e)}")
            raise


def get_google_user_info_sync(code: str) -> Dict[str, str]:
    """Synchronous version for non-async contexts"""
    import asyncio
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(get_google_user_info(code))
