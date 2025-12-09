import os
import sys
import asyncio
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, filters, ContextTypes

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from handlers.auth_handler import start_handler
from handlers.saldo_handler import saldo_callback
from handlers.tabungan_handler import (
    tabungan_menu_callback,
    tabungan_list_callback,
    tabungan_add_income_callback,
    tabungan_add_expense_callback,
    handle_savings_input,
)
from handlers.pinjaman_handler import (
    pinjaman_menu_callback,
    pinjaman_list_callback,
    pinjaman_add_callback,
    pinjaman_add_payment_callback,
    handle_loan_input,
    handle_payment_input,
)
from handlers.target_handler import (
    target_menu_callback,
    target_list_callback,
    target_add_callback,
    target_update_callback,
    handle_target_input,
)
from utils.state_manager import state_manager
from utils.keyboards import get_main_menu_keyboard, get_reply_keyboard


load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
if not TELEGRAM_BOT_TOKEN:
    raise ValueError("TELEGRAM_BOT_TOKEN not set in environment variables")


async def cancel_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle cancel"""
    query = update.callback_query
    if query:
        await query.answer()
        await query.edit_message_text("Cancelled.", reply_markup=get_main_menu_keyboard())
    else:
        await update.message.reply_text("Cancelled.", reply_markup=get_main_menu_keyboard())
    state_manager.clear_waiting_for(update.effective_user.id)


async def menu_main_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle main menu"""
    query = update.callback_query
    await query.answer()
    await query.edit_message_text("Select an option:", reply_markup=get_main_menu_keyboard())


class FakeQuery:
    """Helper class to convert message to callback query"""
    def __init__(self, update):
        self.update = update
    async def answer(self):
        pass
    async def edit_message_text(self, text, *args, **kwargs):
        """Edit message text - for message handler, just reply"""
        if self.update.message:
            # Remove reply_markup from kwargs if present, we'll add reply keyboard separately
            reply_markup = kwargs.pop('reply_markup', None)
            await self.update.message.reply_text(text, *args, **kwargs)
            # Add reply keyboard if main menu
            if reply_markup:
                from utils.keyboards import get_reply_keyboard
                await self.update.message.reply_text(
                    "Atau gunakan menu di bawah:",
                    reply_markup=get_reply_keyboard(),
                )


async def message_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle text messages"""
    user_id = update.effective_user.id
    waiting_for = state_manager.get_waiting_for(user_id)
    text = update.message.text if update.message else ""

    if waiting_for:
        # Handle form inputs
        if waiting_for.startswith("savings") or waiting_for in ["income_amount", "expense_amount"]:
            await handle_savings_input(update, context)
        elif waiting_for.startswith("loan"):
            await handle_loan_input(update, context)
        elif waiting_for.startswith("payment"):
            await handle_payment_input(update, context)
        elif waiting_for.startswith("target") or waiting_for.startswith("update_target"):
            await handle_target_input(update, context)
    else:
        # Handle reply keyboard commands
        if text in ["💰 Saldo", "Saldo"]:
            from handlers.saldo_handler import saldo_callback
            await saldo_callback(update, context, is_keyboard_button=True)
        elif text in ["📂 Tabungan", "Tabungan"]:
            from handlers.tabungan_handler import tabungan_menu_callback
            await tabungan_menu_callback(update, context, is_keyboard_button=True)
        elif text in ["📑 Pinjaman", "Pinjaman"]:
            from handlers.pinjaman_handler import pinjaman_menu_callback
            await pinjaman_menu_callback(update, context, is_keyboard_button=True)
        elif text in ["🎯 Target", "Target"]:
            from handlers.target_handler import target_menu_callback
            await target_menu_callback(update, context, is_keyboard_button=True)
        elif text == "📋 List Tabungan":
            from handlers.tabungan_handler import tabungan_list_callback
            await tabungan_list_callback(update, context, is_keyboard_button=True)
        elif text == "📋 List Pinjaman":
            from handlers.pinjaman_handler import pinjaman_list_callback
            await pinjaman_list_callback(update, context, is_keyboard_button=True)
        elif text == "📋 List Target":
            from handlers.target_handler import target_list_callback
            await target_list_callback(update, context, is_keyboard_button=True)
        elif text in ["🏠 Menu Utama", "Menu Utama"]:
            await update.message.reply_text(
                "Select an option:",
                reply_markup=get_main_menu_keyboard(),
            )
            await update.message.reply_text(
                "Atau gunakan menu di bawah:",
                reply_markup=get_reply_keyboard(),
            )
        else:
            await update.message.reply_text(
                "Use /start to begin or select an option:",
                reply_markup=get_main_menu_keyboard(),
            )


def main():
    """Start the bot"""
    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()

    # Command handlers
    application.add_handler(CommandHandler("start", start_handler))

    # Callback query handlers
    application.add_handler(CallbackQueryHandler(menu_main_callback, pattern="^menu_main$"))
    application.add_handler(CallbackQueryHandler(saldo_callback, pattern="^menu_saldo$"))

    # Tabungan handlers
    application.add_handler(CallbackQueryHandler(tabungan_menu_callback, pattern="^menu_tabungan$"))
    application.add_handler(CallbackQueryHandler(tabungan_list_callback, pattern="^tabungan_list$"))
    application.add_handler(CallbackQueryHandler(tabungan_add_income_callback, pattern="^tabungan_add_income$"))
    application.add_handler(CallbackQueryHandler(tabungan_add_expense_callback, pattern="^tabungan_add_expense$"))

    # Pinjaman handlers
    application.add_handler(CallbackQueryHandler(pinjaman_menu_callback, pattern="^menu_pinjaman$"))
    application.add_handler(CallbackQueryHandler(pinjaman_list_callback, pattern="^pinjaman_list$"))
    application.add_handler(CallbackQueryHandler(pinjaman_add_callback, pattern="^pinjaman_add$"))
    application.add_handler(CallbackQueryHandler(pinjaman_add_payment_callback, pattern="^pinjaman_add_payment$"))

    # Target handlers
    application.add_handler(CallbackQueryHandler(target_menu_callback, pattern="^menu_target$"))
    application.add_handler(CallbackQueryHandler(target_list_callback, pattern="^target_list$"))
    application.add_handler(CallbackQueryHandler(target_add_callback, pattern="^target_add$"))
    application.add_handler(CallbackQueryHandler(target_update_callback, pattern="^target_update$"))

    # Cancel handler
    application.add_handler(CallbackQueryHandler(cancel_callback, pattern="^cancel$"))

    # Message handler (for form inputs)
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, message_handler))

    print("Bot is running...")
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
