# 🛡️ TIREK - School Incident Prevention System

**TIREK** is an advanced AI-powered security system designed to detect and prevent dangerous incidents in schools using real-time Computer Vision and alerting tools.

## 📋 Overview

TIREK leverages computer vision models to monitor camera feeds for signs of fights, weapons, or other threats. It alerts school administrators via Telegram and logs all incidents in a centralized dashboard.

### 🔧 System Components

- **👁️ CV Models** – Detect fights, weapons, and unauthorized activity in real-time.
- **🖥️ Admin Dashboard** – Web-based interface to manage incidents, users, and reports.
- **📊 Centralized Database** – All activity and alerts stored for analysis.
- **📱 Alert System** – Sends real-time Telegram notifications to authorized personnel.

---

## 🌟 Features

- ✅ **Incident Detection:** Detects fights, weapons, and other anomalies using CV.
- ⚠️ **Real-time Alerts:** Immediate notifications via Telegram Bot.
- 🗂 **Incident Archive:** Searchable logs of all previous detections.
- 👥 **User Roles & Permissions:** Admin/staff access control.
- 📈 **Security Analytics:** Discover incident patterns and hotspot zones.
- 📹 **Multi-camera Support:** Seamless switching between camera feeds.

---

## 🏗️ Project Structure


---

## 🚀 Getting Started

### ✅ Prerequisites

- Python 3.8+
- Node.js 14+
- PostgreSQL
- CUDA-compatible GPU (recommended for CV module)

---

### 📦 Installation

#### 🔧 Backend Setup

```bash
git clone https://github.com/your-username/tirek.git
cd tirek
git checkout backend
cd backend

python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

pip install -r requirements.txt
cp .env.example .env  # Update with DB credentials

python init_db.py     # Initialize DB
python app.py         # Launch backend server (http://localhost:5000)
```

### 🎨 Frontend Setup
```bash
git checkout frontend
cd frontend

npm install
npm run dev      # Runs on http://localhost:3000
# For production:
# npm run build
```
### 👁️ CV Module Setup
```bash
git checkout cv
cd cv

python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

pip install -r requirements.txt
python download_models.py

# Start detection system
python main.py

# In a separate terminal
python telegram.py  # Launch Telegram alert service
```

### 📸 Screenshots
<p align="center">
  <img src="https://res.cloudinary.com/dq2pbzrtu/image/upload/v1744908313/ad82a6bc-9932-46db-a588-05ac52920af5.png" alt="Admin Dashboard" />
  <img src="https://res.cloudinary.com/dq2pbzrtu/image/upload/v1744908412/c5453c8c-19c4-4d58-8227-6a098c858210.png" alt="Alert System" /> 
</p>


### How it works?
```bash
Detection: CV models analyze live video for signs of danger.

Classification: Incidents are categorized by type and severity.

Notification: Immediate alerts sent via Telegram.

Logging: All incidents stored in the PostgreSQL database.

Response: Staff can mark events resolved, add notes, and review logs.
```
