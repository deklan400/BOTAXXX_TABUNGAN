from telegram import Update
from telegram.ext import ContextTypes
from services.api_client import APIClient
from utils.state_manager import state_manager


async def start_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command"""
    user_id = str(update.effective_user.id)
    username = update.effective_user.username

    # Try to login
    api_client = APIClient()
    try:
        result = await api_client.telegram_login(user_id, username)
        # Store token in context for this user
        context.user_data["api_client"] = api_client
        context.user_data["authenticated"] = True
        state_manager.set_data(update.effective_user.id, "token", api_client.token)
        state_manager.set_data(update.effective_user.id, "authenticated", True)

        from utils.keyboards import get_main_menu_keyboard, get_reply_keyboard

        await update.message.reply_text(
            "✅ Authenticated! Welcome to BOTAXXX Financial Command Center.\n\nSelect an option:",
            reply_markup=get_main_menu_keyboard(),
        )
        
        # Tambahkan reply keyboard sebagai alternatif
        try:
            await update.message.reply_text(
                "Atau gunakan menu di bawah:",
                reply_markup=get_reply_keyboard(),
            )
        except Exception as kb_error:
            # Jika reply keyboard error, skip saja (inline keyboard sudah cukup)
            pass
    except Exception as e:
        await update.message.reply_text(
            f"❌ Authentication failed. Please register in the dashboard first and set your Telegram ID.\n\nError: {str(e)}"
        )
