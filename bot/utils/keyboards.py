from telegram import InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardMarkup, KeyboardButton


def get_main_menu_keyboard():
    """Get main menu keyboard"""
    keyboard = [
        [InlineKeyboardButton("💰 Check Saldo", callback_data="menu_saldo")],
        [
            InlineKeyboardButton("📂 Tabungan", callback_data="menu_tabungan"),
            InlineKeyboardButton("📑 Pinjaman", callback_data="menu_pinjaman"),
        ],
        [
            InlineKeyboardButton("🎯 Target", callback_data="menu_target"),
            InlineKeyboardButton("🏦 Rekening Bank", callback_data="menu_bank"),
        ],
    ]
    return InlineKeyboardMarkup(keyboard)


def get_tabungan_menu_keyboard():
    """Get tabungan submenu keyboard"""
    keyboard = [
        [InlineKeyboardButton("📋 List Tabungan", callback_data="tabungan_list")],
        [InlineKeyboardButton("➕ Add Income", callback_data="tabungan_add_income")],
        [InlineKeyboardButton("➖ Add Expense", callback_data="tabungan_add_expense")],
        [InlineKeyboardButton("🔙 Back", callback_data="menu_main")],
    ]
    return InlineKeyboardMarkup(keyboard)


def get_pinjaman_menu_keyboard():
    """Get pinjaman submenu keyboard"""
    keyboard = [
        [InlineKeyboardButton("📋 List Pinjaman", callback_data="pinjaman_list")],
        [InlineKeyboardButton("➕ Add Pinjaman", callback_data="pinjaman_add")],
        [InlineKeyboardButton("💳 Add Payment", callback_data="pinjaman_add_payment")],
        [InlineKeyboardButton("🔙 Back", callback_data="menu_main")],
    ]
    return InlineKeyboardMarkup(keyboard)


def get_target_menu_keyboard():
    """Get target submenu keyboard"""
    keyboard = [
        [InlineKeyboardButton("📋 List Target", callback_data="target_list")],
        [InlineKeyboardButton("➕ Add Target", callback_data="target_add")],
        [InlineKeyboardButton("📊 Update Amount", callback_data="target_update")],
        [InlineKeyboardButton("🔙 Back", callback_data="menu_main")],
    ]
    return InlineKeyboardMarkup(keyboard)


def get_bank_menu_keyboard():
    """Get rekening bank submenu keyboard"""
    keyboard = [
        [InlineKeyboardButton("📋 List Rekening Bank", callback_data="bank_list")],
        [InlineKeyboardButton("🔙 Back", callback_data="menu_main")],
    ]
    return InlineKeyboardMarkup(keyboard)


def get_cancel_keyboard():
    """Get cancel keyboard"""
    keyboard = [[InlineKeyboardButton("❌ Cancel", callback_data="cancel")]]
    return InlineKeyboardMarkup(keyboard)


# Reply Keyboard (Menu di bawah chat)
def get_reply_keyboard():
    """Get reply keyboard menu (menu di bawah chat)"""
    keyboard = [
        [KeyboardButton("💰 Saldo"), KeyboardButton("📂 Tabungan")],
        [KeyboardButton("📑 Pinjaman"), KeyboardButton("🎯 Target")],
        [KeyboardButton("🏦 Rekening Bank"), KeyboardButton("📋 List Tabungan")],
        [KeyboardButton("📋 List Pinjaman"), KeyboardButton("📋 List Target")],
        [KeyboardButton("🏠 Menu Utama")],
    ]
    return ReplyKeyboardMarkup(keyboard, resize_keyboard=True)
