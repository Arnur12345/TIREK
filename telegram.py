import telebot
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton
import datetime
import time
import random
import dotenv
import os


dotenv.load_dotenv()
TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
bot = telebot.TeleBot(TOKEN)

@bot.message_handler(commands=['start'])
def start(message):
    keyboard = InlineKeyboardMarkup()
    keyboard.row(InlineKeyboardButton("Subscribe", callback_data='subscribe'))
    keyboard.row(InlineKeyboardButton("Unsubscribe", callback_data='unsubscribe'))
    keyboard.row(InlineKeyboardButton("My subscriptions", callback_data='my_subscriptions'))
    
    bot.send_message(message.chat.id, 'Choose action:', reply_markup=keyboard)

@bot.callback_query_handler(func=lambda call: True)
def button(call):
    bot.answer_callback_query(call.id)
    
    if call.data == 'subscribe':
        # Send first image on subscription
        image_path = 'image.png'
        caption = f"🥊Last fight:\n🕒Time: 2025-03-21 16:00\n📍Location: NIS"
        with open(image_path, 'rb') as photo:
            bot.send_photo(chat_id=call.message.chat.id, photo=photo, caption=caption)
        bot.edit_message_text(text="You have subscribed to notifications.", chat_id=call.message.chat.id, message_id=call.message.message_id)
    elif call.data == 'unsubscribe':
        bot.edit_message_text(text="You have unsubscribed from notifications.", chat_id=call.message.chat.id, message_id=call.message.message_id)
    elif call.data == 'my_subscriptions':
        bot.edit_message_text(text="Your current subscriptions.", chat_id=call.message.chat.id, message_id=call.message.message_id)

@bot.message_handler(commands=['notify'])
def send_notification(message):
    chat_id = message.chat.id
    
    # Send first image
    image_path = 'image.png'
    caption = f"🥊Last fight:\n🕒Time: 2025-03-21 16:00\n📍Location: NIS"
    with open(image_path, 'rb') as photo:
        bot.send_photo(chat_id=chat_id, photo=photo, caption=caption)
    
    # Wait for a day (using shorter time for demonstration)
      # In real scenario this would be 86400 seconds (24 hours)
    
    # Send second image
    image_path = 'image1.png'
    caption = f"🥊Last fight:\n🕒Time: 2025-03-18 14:30\n📍Location: NIS"
    with open(image_path, 'rb') as photo:
        bot.send_photo(chat_id=chat_id, photo=photo, caption=caption)
    
    # Wait another day
    time.sleep(5)  # In real scenario this would be 86400 seconds (24 hours)
    
    # Send third image
    image_path = 'image2.png'
    caption = f"🥊Last fight:\n🕒Time: 2025-03-17 11:31\n📍Location: NIS"
    with open(image_path, 'rb') as photo:
        bot.send_photo(chat_id=chat_id, photo=photo, caption=caption)

if __name__ == '__main__':
    bot.infinity_polling()
