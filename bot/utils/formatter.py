def format_rupiah(amount: float) -> str:
    """Format amount as Rupiah"""
    return f"Rp {amount:,.0f}".replace(",", ".")


def format_savings(savings: dict) -> str:
    """Format savings transaction"""
    type_emoji = "💰" if savings["type"] == "IN" else "💸"
    return f"{type_emoji} {savings['date']}\n{savings.get('category', 'N/A')}\n{format_rupiah(savings['amount'])}\n{savings.get('note', '')}"


def format_loan(loan: dict) -> str:
    """Format loan information"""
    status_emoji = {"active": "🟡", "paid": "🟢", "overdue": "🔴"}.get(loan["status"], "⚪")
    return f"{status_emoji} {loan['borrower_name']}\nPrincipal: {format_rupiah(loan['principal'])}\nRemaining: {format_rupiah(loan['remaining_amount'])}\nStatus: {loan['status']}"


def format_target(target: dict) -> str:
    """Format target information"""
    progress = (target["current_amount"] / target["target_amount"]) * 100 if target["target_amount"] > 0 else 0
    status_emoji = "✅" if target["status"] == "done" else "🎯"
    return f"{status_emoji} {target['name']}\nProgress: {format_rupiah(target['current_amount'])} / {format_rupiah(target['target_amount'])}\n{progress:.1f}%"


def format_overview(overview: dict) -> str:
    """Format overview information"""
    return f"""📊 Financial Overview

💰 Total Balance: {format_rupiah(overview.get('total_balance', 0))}
📑 Active Loans: {format_rupiah(overview.get('total_active_loans_amount', 0))}
🎯 Targets Progress: {format_rupiah(overview.get('total_target_current_amount', 0))}
📈 Monthly Income: {format_rupiah(overview.get('total_income_month', 0))}
📉 Monthly Expense: {format_rupiah(overview.get('total_expense_month', 0))}"""
