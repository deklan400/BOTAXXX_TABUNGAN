from telegram import Update
from telegram.ext import ContextTypes
from utils.keyboards import get_bank_menu_keyboard, get_main_menu_keyboard
from utils.formatter import format_rupiah
from services.api_client import APIClient
from utils.state_manager import state_manager


async def bank_menu_callback(update: Update, context: ContextTypes.DEFAULT_TYPE, is_keyboard_button: bool = False):
    """Handle rekening bank menu"""
    query = update.callback_query
    
    if query:
        try:
            await query.answer()
            await query.edit_message_text("🏦 Rekening Bank Menu", reply_markup=get_bank_menu_keyboard())
        except Exception as e:
            # If message is not modified (same content), just answer the callback
            if "not modified" in str(e).lower():
                await query.answer()
            else:
                # If edit fails for other reason, try to send new message
                try:
                    await query.message.reply_text("🏦 Rekening Bank Menu", reply_markup=get_bank_menu_keyboard())
                except:
                    pass
    elif update.message:
        await update.message.reply_text("🏦 Rekening Bank Menu", reply_markup=get_bank_menu_keyboard())


async def bank_list_callback(update: Update, context: ContextTypes.DEFAULT_TYPE, is_keyboard_button: bool = False):
    """Handle list rekening bank"""
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
        accounts = await api_client.list_bank_accounts(limit=100)
        if not accounts:
            msg = "📋 Tidak ada rekening bank yang terdaftar.\n\nSilakan tambahkan rekening bank melalui dashboard web."
            if query:
                await query.answer()
                await query.edit_message_text(msg, reply_markup=get_bank_menu_keyboard())
            elif update.message:
                await update.message.reply_text(msg, reply_markup=get_bank_menu_keyboard())
            return

        # Get base URL for logo (use API_BASE_URL or construct from it)
        import os
        from dotenv import load_dotenv
        load_dotenv()
        api_base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
        # Remove trailing slash if exists
        api_base_url = api_base_url.rstrip('/')
        # For static files, use the same domain but without /api prefix
        # If API_BASE_URL is http://localhost:8000, use http://localhost
        # If API_BASE_URL is https://api.example.com, use https://example.com
        # For now, assume same domain - user can set PUBLIC_URL env if different
        public_url = os.getenv("PUBLIC_URL", api_base_url.replace(":8000", "").replace("/api", ""))
        public_url = public_url.rstrip('/')
        
        text = "🏦 Daftar Rekening Bank:\n\n"
        
        # Send each account as a separate message with logo if available
        for idx, account in enumerate(accounts, 1):
            bank = account.get("bank", {})
            bank_name = bank.get("name", "Unknown Bank") if bank else "Unknown Bank"
            account_number = account.get("account_number", "N/A")
            account_name = account.get("account_name", "N/A")
            balance = account.get("balance", 0)
            logo_filename = bank.get("logo_filename") if bank else None
            
            account_text = f"<b>{idx}. {bank_name}</b>\n"
            account_text += f"📝 Nama: {account_name}\n"
            account_text += f"🔢 No. Rekening: {account_number}\n"
            account_text += f"💰 Saldo: {format_rupiah(balance)}\n"
            
            # Try to send with logo if available
            if logo_filename:
                logo_url = f"{public_url}/banks/{logo_filename}"
                try:
                    if query:
                        # For callback query, send new message with photo
                        await query.message.reply_photo(
                            photo=logo_url,
                            caption=account_text,
                            parse_mode="HTML"
                        )
                    elif update.message:
                        await update.message.reply_photo(
                            photo=logo_url,
                            caption=account_text,
                            parse_mode="HTML"
                        )
                except Exception as photo_error:
                    # If photo fails, send text only
                    print(f"Failed to send logo: {photo_error}")
                    if query:
                        await query.message.reply_text(account_text, parse_mode="HTML")
                    elif update.message:
                        await update.message.reply_text(account_text, parse_mode="HTML")
            else:
                # No logo, send text only
                if query:
                    await query.message.reply_text(account_text, parse_mode="HTML")
                elif update.message:
                    await update.message.reply_text(account_text, parse_mode="HTML")
            
            # Add separator between accounts
            if idx < len(accounts):
                if query:
                    await query.message.reply_text("─" * 30)
                elif update.message:
                    await update.message.reply_text("─" * 30)
        
        # Send summary and menu
        summary = f"\n📊 Total: {len(accounts)} rekening bank"
        if query:
            await query.message.reply_text(summary, reply_markup=get_bank_menu_keyboard())
        elif update.message:
            await update.message.reply_text(summary, reply_markup=get_bank_menu_keyboard())
            
    except Exception as e:
        error_msg = f"❌ Error: {str(e)}"
        if query:
            try:
                await query.answer()
                await query.edit_message_text(error_msg, reply_markup=get_bank_menu_keyboard())
            except Exception as edit_error:
                if "not modified" in str(edit_error).lower():
                    await query.answer()
                else:
                    try:
                        await query.message.reply_text(error_msg, reply_markup=get_bank_menu_keyboard())
                    except:
                        pass
        elif update.message:
            await update.message.reply_text(error_msg, reply_markup=get_bank_menu_keyboard())

