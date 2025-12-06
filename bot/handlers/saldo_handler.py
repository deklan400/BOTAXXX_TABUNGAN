from telegram import Update
from telegram.ext import ContextTypes
from bot.utils.state_manager import state_manager
from bot.utils.formatter import format_overview
from bot.utils.keyboards import get_main_menu_keyboard
from bot.services.api_client import APIClient


async def saldo_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle saldo check"""
    query = update.callback_query
    await query.answer()

    user_id = update.effective_user.id
    token = state_manager.get_data(user_id, "token")
    
    if not token:
        await query.edit_message_text("❌ Not authenticated. Please use /start")
        return

    api_client = APIClient(token=token)
    try:
        overview = await api_client.get_overview()
        text = format_overview(overview)
        await query.edit_message_text(text, reply_markup=get_main_menu_keyboard())
    except Exception as e:
        await query.edit_message_text(f"❌ Error: {str(e)}", reply_markup=get_main_menu_keyboard())
