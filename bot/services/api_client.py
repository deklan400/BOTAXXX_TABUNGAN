import httpx
import os
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

# Get API_BASE_URL from env, default to localhost
# If IPv6 address, wrap it in brackets
api_url = os.getenv("API_BASE_URL", "http://localhost:8000")
# Handle IPv6 addresses (if URL contains IPv6 without brackets)
if "://" in api_url and "[" not in api_url:
    # Check if it's an IPv6 address (contains colons but no brackets)
    parts = api_url.split("://", 1)
    if len(parts) == 2:
        scheme, rest = parts
        # If rest looks like IPv6 (has multiple colons), wrap in brackets
        if rest.count(":") > 1 and not rest.startswith("["):
            # Extract host and port
            if "/" in rest:
                host_port, path = rest.split("/", 1)
                path = "/" + path
            else:
                host_port = rest
                path = ""
            # Wrap IPv6 in brackets
            if ":" in host_port:
                host, port = host_port.rsplit(":", 1)
                if host.count(":") > 0:  # IPv6 address
                    api_url = f"{scheme}://[{host}]:{port}{path}"
                else:
                    api_url = f"{scheme}://{host}:{port}{path}"
            else:
                if host_port.count(":") > 0:  # IPv6 without port
                    api_url = f"{scheme}://[{host_port}]{path}"

API_BASE_URL = api_url


class APIClient:
    def __init__(self, token: Optional[str] = None):
        self.token = token
        self.base_url = API_BASE_URL

    def _get_headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    async def telegram_login(self, telegram_id: str, telegram_username: Optional[str] = None) -> Dict[str, Any]:
        """Login via Telegram ID and get JWT token"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/auth/telegram-login",
                json={
                    "telegram_id": telegram_id,
                    "telegram_username": telegram_username,
                },
                headers=self._get_headers(),
            )
            response.raise_for_status()
            data = response.json()
            self.token = data["access_token"]
            return data

    async def get_overview(self) -> Dict[str, Any]:
        """Get financial overview"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/overview",
                headers=self._get_headers(),
            )
            response.raise_for_status()
            return response.json()

    async def list_savings(self, skip: int = 0, limit: int = 10) -> list:
        """List savings transactions"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/savings?skip={skip}&limit={limit}",
                headers=self._get_headers(),
            )
            response.raise_for_status()
            return response.json()

    async def create_savings(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a savings transaction"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/savings",
                json=data,
                headers=self._get_headers(),
            )
            response.raise_for_status()
            return response.json()

    async def get_balance(self) -> Dict[str, Any]:
        """Get balance information"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/savings/balance",
                headers=self._get_headers(),
            )
            response.raise_for_status()
            return response.json()

    async def list_loans(self, skip: int = 0, limit: int = 10) -> list:
        """List loans"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/loans?skip={skip}&limit={limit}",
                headers=self._get_headers(),
            )
            response.raise_for_status()
            return response.json()

    async def create_loan(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a loan"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/loans",
                json=data,
                headers=self._get_headers(),
            )
            response.raise_for_status()
            return response.json()

    async def add_payment(self, loan_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """Add payment to a loan"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/loans/{loan_id}/payments",
                json=data,
                headers=self._get_headers(),
            )
            response.raise_for_status()
            return response.json()

    async def list_targets(self, skip: int = 0, limit: int = 10) -> list:
        """List targets"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/targets?skip={skip}&limit={limit}",
                headers=self._get_headers(),
            )
            response.raise_for_status()
            return response.json()

    async def create_target(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a target"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/targets",
                json=data,
                headers=self._get_headers(),
            )
            response.raise_for_status()
            return response.json()

    async def update_target(self, target_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a target"""
        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{self.base_url}/targets/{target_id}",
                json=data,
                headers=self._get_headers(),
            )
            response.raise_for_status()
            return response.json()
