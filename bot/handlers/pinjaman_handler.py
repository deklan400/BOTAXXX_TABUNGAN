from datetime import date
from telegram import Update
from telegram.ext import ContextTypes
from utils.state_manager import state_manager
from utils.keyboards import get_pinjaman_menu_keyboard, get_main_menu_keyboard, get_cancel_keyboard
from utils.formatter import format_loan
from services.api_client import APIClient


async def pinjaman_menu_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle pinjaman menu"""
    query = update.callback_query
    await query.answer()

    await query.edit_message_text("📑 Pinjaman Menu", reply_markup=get_pinjaman_menu_keyboard())


async def pinjaman_list_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle list pinjaman"""
    query = update.callback_query
    await query.answer()

    user_id = update.effective_user.id
    api_client = state_manager.get_data(user_id, "api_client")

    if not api_client:
        await query.edit_message_text("❌ Not authenticated")
        return

    try:
        loans = await api_client.list_loans(limit=10)
        if not loans:
            await query.edit_message_text("No loans found.", reply_markup=get_pinjaman_menu_keyboard())
            return

        text = "📋 Loans:\n\n"
        for loan in loans[:5]:
            text += f"{format_loan(loan)}\n\n"

        await query.edit_message_text(text, reply_markup=get_pinjaman_menu_keyboard())
    except Exception as e:
        await query.edit_message_text(f"❌ Error: {str(e)}", reply_markup=get_pinjaman_menu_keyboard())


async def pinjaman_add_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start adding loan"""
    query = update.callback_query
    await query.answer()

    user_id = update.effective_user.id
    state_manager.set_waiting_for(user_id, "loan_borrower")

    await query.edit_message_text(
        "➕ Add Pinjaman\n\nEnter borrower name:",
        reply_markup=get_cancel_keyboard(),
    )


async def handle_loan_input(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle loan input"""
    user_id = update.effective_user.id
    waiting_for = state_manager.get_waiting_for(user_id)
    token = state_manager.get_data(user_id, "token")

    if not token:
        await update.message.reply_text("❌ Not authenticated")
        return

    api_client = APIClient(token=token)

    if waiting_for == "loan_borrower":
        state_manager.set_data(user_id, "loan_borrower", update.message.text)
        state_manager.set_waiting_for(user_id, "loan_principal")
        await update.message.reply_text("Enter principal amount:")

    elif waiting_for == "loan_principal":
        try:
            principal = float(update.message.text)
            state_manager.set_data(user_id, "loan_principal", principal)
            state_manager.set_waiting_for(user_id, None)

            borrower = state_manager.get_data(user_id, "loan_borrower")
            await api_client.create_loan({
                "borrower_name": borrower,
                "principal": principal,
                "start_date": str(date.today()),
            })

            state_manager.clear_waiting_for(user_id)
            await update.message.reply_text(
                "✅ Loan added successfully!",
                reply_markup=get_pinjaman_menu_keyboard(),
            )
        except ValueError:
            await update.message.reply_text("❌ Invalid amount. Please enter a number:")
        except Exception as e:
            await update.message.reply_text(f"❌ Error: {str(e)}")


async def pinjaman_add_payment_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start adding payment"""
    query = update.callback_query
    await query.answer()

    user_id = update.effective_user.id
    token = state_manager.get_data(user_id, "token")
    
    if not token:
        await query.edit_message_text("❌ Not authenticated")
        return

    api_client = APIClient(token=token)
    try:
        loans = await api_client.list_loans(limit=10)
        if not loans:
            await query.edit_message_text("No loans found.", reply_markup=get_pinjaman_menu_keyboard())
            return

        # For simplicity, use first active loan
        active_loans = [l for l in loans if l["status"] == "active"]
        if not active_loans:
            await query.edit_message_text("No active loans found.", reply_markup=get_pinjaman_menu_keyboard())
            return

        loan = active_loans[0]
        state_manager.set_data(user_id, "payment_loan_id", loan["id"])
        state_manager.set_waiting_for(user_id, "payment_amount")

        await query.edit_message_text(
            f"💳 Add Payment\n\nLoan: {loan['borrower_name']}\nEnter payment amount:",
            reply_markup=get_cancel_keyboard(),
        )
    except Exception as e:
        await query.edit_message_text(f"❌ Error: {str(e)}", reply_markup=get_pinjaman_menu_keyboard())


async def handle_payment_input(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle payment input"""
    user_id = update.effective_user.id
    waiting_for = state_manager.get_waiting_for(user_id)
    token = state_manager.get_data(user_id, "token")

    if not token:
        await update.message.reply_text("❌ Not authenticated")
        return

    api_client = APIClient(token=token)

    if waiting_for == "payment_amount":
        try:
            amount = float(update.message.text)
            loan_id = state_manager.get_data(user_id, "payment_loan_id")

            await api_client.add_payment(loan_id, {
                "date": str(date.today()),
                "amount": amount,
            })

            state_manager.clear_waiting_for(user_id)
            await update.message.reply_text(
                "✅ Payment added successfully!",
                reply_markup=get_pinjaman_menu_keyboard(),
            )
        except ValueError:
            await update.message.reply_text("❌ Invalid amount. Please enter a number:")
        except Exception as e:
            await update.message.reply_text(f"❌ Error: {str(e)}")
