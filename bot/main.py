import os
import asyncio
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, filters, ContextTypes

from bot.handlers.auth_handler import start_handler
from bot.handlers.saldo_handler import saldo_callback
from bot.handlers.tabungan_handler import (
    tabungan_menu_callback,
    tabungan_list_callback,
    tabungan_add_income_callback,
    tabungan_add_expense_callback,
    handle_savings_input,
)
from bot.handlers.pinjaman_handler import (
    pinjaman_menu_callback,
    pinjaman_list_callback,
    pinjaman_add_callback,
    pinjaman_add_payment_callback,
    handle_loan_input,
    handle_payment_input,
)
from bot.handlers.target_handler import (
    target_menu_callback,
    target_list_callback,
    target_add_callback,
    target_update_callback,
    handle_target_input,
)
from bot.utils.state_manager import state_manager
from bot.utils.keyboards import get_main_menu_keyboard


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


async def message_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle text messages"""
    user_id = update.effective_user.id
    waiting_for = state_manager.get_waiting_for(user_id)

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
