from datetime import date
from telegram import Update
from telegram.ext import ContextTypes
from utils.state_manager import state_manager
from utils.keyboards import get_tabungan_menu_keyboard, get_main_menu_keyboard, get_cancel_keyboard
from utils.formatter import format_savings, format_rupiah
from services.api_client import APIClient


async def tabungan_menu_callback(update: Update, context: ContextTypes.DEFAULT_TYPE, is_keyboard_button: bool = False):
    """Handle tabungan menu"""
    query = update.callback_query
    
    if query:
        try:
            await query.answer()
            await query.edit_message_text("📂 Tabungan Menu", reply_markup=get_tabungan_menu_keyboard())
        except Exception as e:
            # If message is not modified (same content), just answer the callback
            if "not modified" in str(e).lower():
                await query.answer()
            else:
                # If edit fails for other reason, try to send new message
                try:
                    await query.message.reply_text("📂 Tabungan Menu", reply_markup=get_tabungan_menu_keyboard())
                except:
                    pass
    elif update.message:
        await update.message.reply_text("📂 Tabungan Menu", reply_markup=get_tabungan_menu_keyboard())


async def tabungan_list_callback(update: Update, context: ContextTypes.DEFAULT_TYPE, is_keyboard_button: bool = False):
    """Handle list tabungan"""
    query = update.callback_query
    user_id = update.effective_user.id
    token = state_manager.get_data(user_id, "token")
    
    if not token:
        error_msg = "❌ Not authenticated"
        if query:
            await query.answer()
            await query.edit_message_text(error_msg)
        elif update.message:
            await update.message.reply_text(error_msg)
        return

    api_client = APIClient(token=token)
    try:
        savings = await api_client.list_savings(limit=10)
        if not savings:
            msg = "No savings transactions found."
            if query:
                await query.answer()
                await query.edit_message_text(msg, reply_markup=get_tabungan_menu_keyboard())
            elif update.message:
                await update.message.reply_text(msg, reply_markup=get_tabungan_menu_keyboard())
            return

        text = "📋 Recent Savings:\n\n"
        for s in savings[:5]:
            text += f"{format_savings(s)}\n\n"

        if query:
            try:
                await query.answer()
                await query.edit_message_text(text, reply_markup=get_tabungan_menu_keyboard())
            except Exception as edit_error:
                if "not modified" in str(edit_error).lower():
                    await query.answer()
                else:
                    try:
                        await query.message.reply_text(text, reply_markup=get_tabungan_menu_keyboard())
                    except:
                        pass
        elif update.message:
            await update.message.reply_text(text, reply_markup=get_tabungan_menu_keyboard())
    except Exception as e:
        error_msg = f"❌ Error: {str(e)}"
        if query:
            try:
                await query.answer()
                await query.edit_message_text(error_msg, reply_markup=get_tabungan_menu_keyboard())
            except Exception as edit_error:
                if "not modified" in str(edit_error).lower():
                    await query.answer()
                else:
                    try:
                        await query.message.reply_text(error_msg, reply_markup=get_tabungan_menu_keyboard())
                    except:
                        pass
        elif update.message:
            await update.message.reply_text(error_msg, reply_markup=get_tabungan_menu_keyboard())


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
            from utils.keyboards import get_tabungan_menu_keyboard
            await update.message.reply_text(
                f"✅ {savings_type} transaction added successfully!",
                reply_markup=get_tabungan_menu_keyboard(),
            )
        except Exception as e:
            await update.message.reply_text(f"❌ Error: {str(e)}")
