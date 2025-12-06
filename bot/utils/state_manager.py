import json
import os
from typing import Dict, Optional
from pathlib import Path

STATE_FILE = Path(__file__).parent.parent / "data" / "user_states.json"


class StateManager:
    def __init__(self):
        self.states: Dict[int, Dict] = {}
        self.load_states()

    def load_states(self):
        """Load states from file"""
        if STATE_FILE.exists():
            try:
                with open(STATE_FILE, "r") as f:
                    self.states = json.load(f)
                    # Convert keys to int
                    self.states = {int(k): v for k, v in self.states.items()}
            except Exception as e:
                print(f"Error loading states: {e}")
                self.states = {}

    def save_states(self):
        """Save states to file"""
        STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
        try:
            with open(STATE_FILE, "w") as f:
                json.dump(self.states, f, indent=2)
        except Exception as e:
            print(f"Error saving states: {e}")

    def get_state(self, user_id: int) -> Dict:
        """Get state for a user"""
        return self.states.get(user_id, {})

    def set_state(self, user_id: int, state: Dict):
        """Set state for a user"""
        self.states[user_id] = state
        self.save_states()

    def clear_state(self, user_id: int):
        """Clear state for a user"""
        if user_id in self.states:
            del self.states[user_id]
            self.save_states()

    def set_waiting_for(self, user_id: int, field: str):
        """Set what field we're waiting for"""
        state = self.get_state(user_id)
        state["waiting_for"] = field
        self.set_state(user_id, state)

    def get_waiting_for(self, user_id: int) -> Optional[str]:
        """Get what field we're waiting for"""
        state = self.get_state(user_id)
        return state.get("waiting_for")

    def clear_waiting_for(self, user_id: int):
        """Clear waiting_for field"""
        state = self.get_state(user_id)
        if "waiting_for" in state:
            del state["waiting_for"]
        self.set_state(user_id, state)

    def set_data(self, user_id: int, key: str, value: any):
        """Set a data field"""
        state = self.get_state(user_id)
        state[key] = value
        self.set_state(user_id, state)

    def get_data(self, user_id: int, key: str, default=None):
        """Get a data field"""
        state = self.get_state(user_id)
        return state.get(key, default)


state_manager = StateManager()
