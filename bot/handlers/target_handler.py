from telegram import Update
from telegram.ext import ContextTypes
from bot.utils.state_manager import state_manager
from bot.utils.keyboards import get_target_menu_keyboard, get_main_menu_keyboard, get_cancel_keyboard
from bot.utils.formatter import format_target
from bot.services.api_client import APIClient


async def target_menu_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle target menu"""
    query = update.callback_query
    await query.answer()

    await query.edit_message_text("🎯 Target Menu", reply_markup=get_target_menu_keyboard())


async def target_list_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle list targets"""
    query = update.callback_query
    await query.answer()

    user_id = update.effective_user.id
    api_client = state_manager.get_data(user_id, "api_client")

    if not api_client:
        await query.edit_message_text("❌ Not authenticated")
        return

    try:
        targets = await api_client.list_targets(limit=10)
        if not targets:
            await query.edit_message_text("No targets found.", reply_markup=get_target_menu_keyboard())
            return

        text = "📋 Targets:\n\n"
        for target in targets[:5]:
            text += f"{format_target(target)}\n\n"

        await query.edit_message_text(text, reply_markup=get_target_menu_keyboard())
    except Exception as e:
        await query.edit_message_text(f"❌ Error: {str(e)}", reply_markup=get_target_menu_keyboard())


async def target_add_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start adding target"""
    query = update.callback_query
    await query.answer()

    user_id = update.effective_user.id
    state_manager.set_waiting_for(user_id, "target_name")

    await query.edit_message_text(
        "➕ Add Target\n\nEnter target name:",
        reply_markup=get_cancel_keyboard(),
    )


async def target_update_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start updating target amount"""
    query = update.callback_query
    await query.answer()

    user_id = update.effective_user.id
    token = state_manager.get_data(user_id, "token")
    
    if not token:
        await query.edit_message_text("❌ Not authenticated")
        return

    api_client = APIClient(token=token)
    try:
        targets = await api_client.list_targets(limit=10)
        if not targets:
            await query.edit_message_text("No targets found.", reply_markup=get_target_menu_keyboard())
            return

        # Use first active target
        active_targets = [t for t in targets if t["status"] == "active"]
        if not active_targets:
            await query.edit_message_text("No active targets found.", reply_markup=get_target_menu_keyboard())
            return

        target = active_targets[0]
        state_manager.set_data(user_id, "update_target_id", target["id"])
        state_manager.set_waiting_for(user_id, "update_target_amount")

        await query.edit_message_text(
            f"📊 Update Target\n\nTarget: {target['name']}\nCurrent: {target['current_amount']}\nEnter new current amount:",
            reply_markup=get_cancel_keyboard(),
        )
    except Exception as e:
        await query.edit_message_text(f"❌ Error: {str(e)}", reply_markup=get_target_menu_keyboard())


async def handle_target_input(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle target input"""
    user_id = update.effective_user.id
    waiting_for = state_manager.get_waiting_for(user_id)
    token = state_manager.get_data(user_id, "token")

    if not token:
        await update.message.reply_text("❌ Not authenticated")
        return

    api_client = APIClient(token=token)

    if waiting_for == "target_name":
        state_manager.set_data(user_id, "target_name", update.message.text)
        state_manager.set_waiting_for(user_id, "target_amount")
        await update.message.reply_text("Enter target amount:")

    elif waiting_for == "target_amount":
        try:
            target_amount = float(update.message.text)
            name = state_manager.get_data(user_id, "target_name")

            await api_client.create_target({
                "name": name,
                "target_amount": target_amount,
                "current_amount": 0,
            })

            state_manager.clear_waiting_for(user_id)
            await update.message.reply_text(
                "✅ Target added successfully!",
                reply_markup=get_target_menu_keyboard(),
            )
        except ValueError:
            await update.message.reply_text("❌ Invalid amount. Please enter a number:")
        except Exception as e:
            await update.message.reply_text(f"❌ Error: {str(e)}")

    elif waiting_for == "update_target_amount":
        try:
            new_amount = float(update.message.text)
            target_id = state_manager.get_data(user_id, "update_target_id")

            await api_client.update_target(target_id, {
                "current_amount": new_amount,
            })

            state_manager.clear_waiting_for(user_id)
            await update.message.reply_text(
                "✅ Target updated successfully!",
                reply_markup=get_target_menu_keyboard(),
            )
        except ValueError:
            await update.message.reply_text("❌ Invalid amount. Please enter a number:")
        except Exception as e:
            await update.message.reply_text(f"❌ Error: {str(e)}")
