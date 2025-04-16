import os
from dotenv import load_dotenv

load_dotenv()

# Конфигурация для базы данных и телеграм-бота
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
NGROK_TUNNEL_URL = os.getenv("NGROK_TUNNEL_URL")

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.getenv('SECRET_KEY', 'default-secret-key')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'default-jwt-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = 86400  # 24 hours

# Настройки для Telegram бота
WEBHOOK_PORT = int(os.getenv('WEBHOOK_PORT', '5000'))