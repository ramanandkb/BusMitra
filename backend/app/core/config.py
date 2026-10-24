import os

class Settings:
    PROJECT_NAME: str = "Bus Passenger Assistant API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./bus_assistant.db")
    ALLOWED_ORIGINS: list[str] = ["*"]
    UPLOAD_DIR: str = os.path.join(os.getcwd(), "uploads")

settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
