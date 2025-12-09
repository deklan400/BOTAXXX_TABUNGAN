from telegram import Update
from telegram.ext import ContextTypes
from utils.state_manager import state_manager
from utils.formatter import format_overview
from utils.keyboards import get_main_menu_keyboard
from services.api_client import APIClient


async def saldo_callback(update: Update, context: ContextTypes.DEFAULT_TYPE, is_keyboard_button: bool = False):
    """Handle saldo check"""
    query = update.callback_query
    user_id = update.effective_user.id
    token = state_manager.get_data(user_id, "token")
    
    if not token:
        error_msg = "❌ Not authenticated. Please use /start"
        if query:
            await query.answer()
            await query.edit_message_text(error_msg)
        elif update.message:
            await update.message.reply_text(error_msg)
        return

    api_client = APIClient(token=token)
    try:
        overview = await api_client.get_overview()
        text = format_overview(overview)
        
        if query:
            await query.answer()
            await query.edit_message_text(text, reply_markup=get_main_menu_keyboard())
        elif update.message:
            await update.message.reply_text(text, reply_markup=get_main_menu_keyboard())
    except Exception as e:
        error_msg = f"❌ Error: {str(e)}"
        if query:
            await query.answer()
            await query.edit_message_text(error_msg, reply_markup=get_main_menu_keyboard())
        elif update.message:
            await update.message.reply_text(error_msg, reply_markup=get_main_menu_keyboard())
