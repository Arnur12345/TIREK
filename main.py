from models.models import UserAccount, SessionLocal, Organization, Event, EventType, Subscription, Base
import telebot
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton
from config import TELEGRAM_BOT_TOKEN as TOKEN
from config import NGROK_TUNNEL_URL
import os
from sqlalchemy.orm import joinedload
import logging
from sqlalchemy import event, inspect, desc
import threading
import time

bot = telebot.TeleBot(TOKEN)

WEBHOOK_PATH = f"/bot/{TOKEN}"
WEBHOOK_URL = f"{NGROK_TUNNEL_URL}{WEBHOOK_PATH}"

# Logging setup
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                    handlers=[logging.FileHandler("bot.log"), logging.StreamHandler()])
logger = logging.getLogger(__name__)

# Global variable to store current state of tables and last event
current_tables = set()
LAST_EVENT_ID = None

# Function to check for new events
def check_events():
    global LAST_EVENT_ID
    db = SessionLocal()
    try:
        # Get the latest event
        latest_event = db.query(Event).order_by(desc(Event.timestamp)).first()
        
        if latest_event and (LAST_EVENT_ID is None or LAST_EVENT_ID != latest_event.id):
            logger.info(f"New event detected with ID: {latest_event.id}")
            LAST_EVENT_ID = latest_event.id
            send_event_notification(latest_event.id)
    except Exception as e:
        logger.error(f"Error checking for new events: {str(e)}")
    finally:
        db.close()
    
    # Start the check again after a certain interval
    threading.Timer(10, check_events).start()  # Check every 10 seconds

# Function to check for changes in database structure
def check_database_changes():
    global current_tables
    db = SessionLocal()
    try:
        inspector = inspect(db.bind)
        new_tables = set(inspector.get_table_names())
        
        # Check if there are new tables
        if current_tables and new_tables - current_tables:
            new_added_tables = new_tables - current_tables
            logger.info(f"New tables detected: {', '.join(new_added_tables)}")
            
            # Send notification to administrators
            admin_chat_ids = [admin.telegram_chat_id for admin in db.query(Subscription).filter(
                Subscription.event_type == EventType.STUDENT_ENTRANCE
            ).distinct(Subscription.telegram_chat_id).all()]
            
            for chat_id in admin_chat_ids:
                try:
                    bot.send_message(
                        chat_id,
                        f"⚠️ Attention! New tables detected in the database: {', '.join(new_added_tables)}"
                    )
                except Exception as e:
                    logger.error(f"Error sending notification about new tables: {str(e)}")
        
        # Update current state of tables
        current_tables = new_tables
    except Exception as e:
        logger.error(f"Error checking for database changes: {str(e)}")
    finally:
        db.close()
    
    # Start the check again after a certain interval
    threading.Timer(3600, check_database_changes).start()  # Check every hour

@bot.message_handler(commands=['start'])
def start(message):
    user_name = message.from_user.full_name if message.from_user else "my friend"
    text = f"""
<b>Hello, {user_name}! 👋</b>

I'm your <i>TIREK Bot</i> 🤖

I'm here to help you with notifications. Let's get started!

<b>What would you like to do?</b>
• Add subscriptions 🔔 - /subscribe
• View recent events 📬 - /notify
• Get help and support ❓ - /contact_support

Please use the commands above for navigation.
"""
    bot.send_message(message.chat.id, text, parse_mode='HTML')

@bot.message_handler(commands=['subscribe'])
def subscribe(message):
    # Get list of all organizations
    db = SessionLocal()
    try:
        organizations = db.query(Organization).all()
        
        # Create keyboard with buttons for each organization
        markup = InlineKeyboardMarkup()
        for org in organizations:
            markup.add(InlineKeyboardButton(org.org_name, callback_data=f"org_{org.id}"))
        
        bot.send_message(message.chat.id, "Select your organization:", reply_markup=markup)
    except Exception as e:
        bot.send_message(message.chat.id, f"An error occurred: {str(e)}")
        logger.error(f"Error getting organizations: {str(e)}")
    finally:
        db.close()

@bot.callback_query_handler(func=lambda call: call.data.startswith('org_'))
def handle_org_selection(call):
    org_id = call.data.split('_')[1]
    
    db = SessionLocal()
    try:
        # Get all students in the selected organization
        students = db.query(UserAccount).filter(
            UserAccount.organization_id == org_id,
            UserAccount.user_role == 'STUDENT'
        ).all()
        
        # Create keyboard with buttons for each student
        markup = InlineKeyboardMarkup()
        for student in students:
            markup.add(InlineKeyboardButton(student.user_name, callback_data=f"student_{student.id}_{org_id}"))
        
        bot.edit_message_text(
            chat_id=call.message.chat.id,
            message_id=call.message.message_id,
            text="Select a student:",
            reply_markup=markup
        )
    except Exception as e:
        bot.send_message(call.message.chat.id, f"An error occurred: {str(e)}")
        logger.error(f"Error selecting organization: {str(e)}")
    finally:
        db.close()

@bot.callback_query_handler(func=lambda call: call.data.startswith('student_'))
def handle_student_selection(call):
    parts = call.data.split('_')
    student_id = parts[1]
    org_id = parts[2]
    
    db = SessionLocal()
    try:
        # Create subscription notifications for this student
        for event_type in [EventType.WEAPON, EventType.FIGHTING, EventType.SMOKING]:
            # Check if such subscription already exists
            existing_sub = db.query(Subscription).filter(
                Subscription.telegram_chat_id == call.message.chat.id,
                Subscription.student_id == student_id,
                Subscription.event_type == event_type
            ).first()
            
            if not existing_sub:
                new_subscription = Subscription(
                    organization_id=org_id,
                    telegram_chat_id=call.message.chat.id,
                    event_type=event_type,
                    student_id=student_id
                )
                db.add(new_subscription)
        
        db.commit()  # Commit all subscriptions in one transaction
        
        # Send subscription confirmation message
        student = db.query(UserAccount).filter(UserAccount.id == student_id).first()
        bot.send_message(
            call.message.chat.id,
            f"You have successfully subscribed to notifications for student {student.user_name}. You will receive notifications about important events."
        )
        
    except Exception as e:
        bot.send_message(call.message.chat.id, f"An error occurred: {str(e)}")
        db.rollback()  # Rollback transaction in case of error
        logger.error(f"Error creating subscription: {str(e)}")
    finally:
        db.close()

# Function to send notifications to subscribers
def send_event_notification(event_id):
    db = SessionLocal()
    try:
        # Get information about the event
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            logger.error(f"Event with ID {event_id} not found")
            return
        
        # Find all subscriptions matching this event
        subscriptions = db.query(Subscription).filter(
            Subscription.student_id == event.student_id,
            Subscription.event_type == event.event_type
        ).all()
        
        if not subscriptions:
            logger.info(f"No subscriptions found for event {event_id}")
            return
        
        # Get information about the student
        student = db.query(UserAccount).filter(UserAccount.id == event.student_id).first()
        student_name = student.user_name if student else "Unknown student"
        
        # Format notification text
        event_text = f"⚠️ ATTENTION! New event detected!\n\n"
        event_text += f"Student: {student_name}\n"
        event_text += f"Event type: {event.event_type.value}\n"
        event_text += f"Date and time: {event.timestamp}\n"
        
        # Send notifications to all subscribers
        for subscription in subscriptions:
            try:
                # If there's an image, send it with caption
                image_path = f"events/{event_id}.jpg"  # Assumed path to event image
                if os.path.exists(image_path):
                    with open(image_path, 'rb') as photo:
                        bot.send_photo(
                            subscription.telegram_chat_id,
                            photo,
                            caption=event_text
                        )
                else:
                    # If no image, send text only
                    bot.send_message(
                        subscription.telegram_chat_id,
                        event_text
                    )
                logger.info(f"Notification sent to chat {subscription.telegram_chat_id}")
            except Exception as e:
                logger.error(f"Error sending notification to chat {subscription.telegram_chat_id}: {str(e)}")
    
    except Exception as e:
        logger.error(f"Error processing event {event_id}: {str(e)}")
    finally:
        db.close()

# Bot startup
if __name__ == "__main__":
    logger.info("Bot started")
    # Initialize current state of tables at startup
    db = SessionLocal()
    try:
        inspector = inspect(db.bind)
        current_tables = set(inspector.get_table_names())
        logger.info(f"Current tables in database: {', '.join(current_tables)}")
        
        # Initialize last event
        latest_event = db.query(Event).order_by(desc(Event.timestamp)).first()
        if latest_event:
            LAST_EVENT_ID = latest_event.id
            logger.info(f"Last event in database: ID {LAST_EVENT_ID}")
    except Exception as e:
        logger.error(f"Error initializing state: {str(e)}")
    finally:
        db.close()
    
    # Start periodic check for database changes
    check_database_changes()
    
    # Start periodic check for new events
    check_events()
    
    # Start the bot
    bot.polling(none_stop=True)
