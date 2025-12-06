from datetime import date
from telegram import Update
from telegram.ext import ContextTypes
from bot.utils.state_manager import state_manager
from bot.utils.keyboards import get_tabungan_menu_keyboard, get_main_menu_keyboard, get_cancel_keyboard
from bot.utils.formatter import format_savings, format_rupiah
from bot.services.api_client import APIClient


async def tabungan_menu_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle tabungan menu"""
    query = update.callback_query
    await query.answer()

    await query.edit_message_text("📂 Tabungan Menu", reply_markup=get_tabungan_menu_keyboard())


async def tabungan_list_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle list tabungan"""
    query = update.callback_query
    await query.answer()

    user_id = update.effective_user.id
    token = state_manager.get_data(user_id, "token")
    
    if not token:
        await query.edit_message_text("❌ Not authenticated")
        return

    api_client = APIClient(token=token)
    try:
        savings = await api_client.list_savings(limit=10)
        if not savings:
            await query.edit_message_text("No savings transactions found.", reply_markup=get_tabungan_menu_keyboard())
            return

        text = "📋 Recent Savings:\n\n"
        for s in savings[:5]:
            text += f"{format_savings(s)}\n\n"

        await query.edit_message_text(text, reply_markup=get_tabungan_menu_keyboard())
    except Exception as e:
        await query.edit_message_text(f"❌ Error: {str(e)}", reply_markup=get_tabungan_menu_keyboard())


async def tabungan_add_income_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start adding income"""
    query = update.callback_query
    await query.answer()

    user_id = update.effective_user.id
    state_manager.set_waiting_for(user_id, "income_amount")
    state_manager.set_data(user_id, "savings_type", "IN")

    await query.edit_message_text(
        "➕ Add Income\n\nEnter the amount:",
        reply_markup=get_cancel_keyboard(),
    )


async def tabungan_add_expense_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start adding expense"""
    query = update.callback_query
    await query.answer()

    user_id = update.effective_user.id
    state_manager.set_waiting_for(user_id, "expense_amount")
    state_manager.set_data(user_id, "savings_type", "OUT")

    await query.edit_message_text(
        "➖ Add Expense\n\nEnter the amount:",
        reply_markup=get_cancel_keyboard(),
    )


async def handle_savings_input(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle savings input"""
    user_id = update.effective_user.id
    waiting_for = state_manager.get_waiting_for(user_id)
    token = state_manager.get_data(user_id, "token")

    if not token:
        await update.message.reply_text("❌ Not authenticated")
        return

    api_client = APIClient(token=token)

    if waiting_for in ["income_amount", "expense_amount"]:
        try:
            amount = float(update.message.text)
            state_manager.set_data(user_id, "savings_amount", amount)
            state_manager.set_waiting_for(user_id, "savings_category")
            await update.message.reply_text("Enter category (or send /skip to skip):")
        except ValueError:
            await update.message.reply_text("❌ Invalid amount. Please enter a number:")

    elif waiting_for == "savings_category":
        category = update.message.text if update.message.text != "/skip" else None
        state_manager.set_data(user_id, "savings_category", category)
        state_manager.set_waiting_for(user_id, "savings_note")
        await update.message.reply_text("Enter note (or send /skip to skip):")

    elif waiting_for == "savings_note":
        note = update.message.text if update.message.text != "/skip" else None
        savings_type = state_manager.get_data(user_id, "savings_type")
        amount = state_manager.get_data(user_id, "savings_amount")
        category = state_manager.get_data(user_id, "savings_category")

        try:
            await api_client.create_savings({
                "date": str(date.today()),
                "type": savings_type,
                "category": category,
                "amount": amount,
                "note": note,
            })

            state_manager.clear_waiting_for(user_id)
            from bot.utils.keyboards import get_tabungan_menu_keyboard
            await update.message.reply_text(
                f"✅ {savings_type} transaction added successfully!",
                reply_markup=get_tabungan_menu_keyboard(),
            )
        except Exception as e:
            await update.message.reply_text(f"❌ Error: {str(e)}")
