import requests
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file = ".env")
    
    vapi_api_key: str = "your_vapi_api_key_here" # Placeholder
    vapi_assistant_id: str = "your_assistant_id_here" # Placeholder

settings = Settings()

class VapiService:
    @staticmethod
    def trigger_call(phone_number: str, message: str):
        """
        Triggers a call via Vapi API.
        This is a basic implementation. In a real scenario, you'd use their SDK or detailed API docs.
        """
        url = "https://api.vapi.ai/call/phone"
        headers = {
            "Authorization": f"Bearer {settings.vapi_api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "phoneNumber": phone_number,
            "assistant": {
                "model": {
                    "provider": "openai",
                    "model": "gpt-4o",
                    "messages": [
                        {
                            "role": "system",
                            "content": f"You are a friendly reminder assistant. Your message is: {message}"
                        }
                    ]
                }
            }
        }
        
        # Using mocks/logging for now if no API key is provided
        if settings.vapi_api_key == "your_vapi_api_key_here":
            print(f"MOCK CALL TRIGGERED: To {phone_number} with message: {message}")
            return {"status": "mocked", "message": "API Key missing, call simulated"}

        try:
            response = requests.post(url, json=payload, headers=headers)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error triggering Vapi call: {e}")
            return {"status": "error", "message": str(e)}
