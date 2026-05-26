# 🚀 PetNeo Backend Setup Guide

This guide walks you through setting up the **PetNeo Backend** using **Python**, **PostgreSQL**, **FastAPI**, and **pgAdmin**.

---

## 📦 1. Install Required Software

### Install PostgreSQL

- Download from: [https://www.postgresql.org/download/](https://www.postgresql.org/download/)
- During installation:
  - Set a password for the default `postgres` user
  - Install `pgAdmin` as well

### Install Python

- Download from: [https://www.python.org/downloads/](https://www.python.org/downloads/)
- ✅ Check "Add Python to PATH" during installation

### Install PyCharm (Optional IDE)

- Download from: [https://www.jetbrains.com/pycharm/download/](https://www.jetbrains.com/pycharm/download/)

---

## 🐘 2. PostgreSQL Setup via pgAdmin

1. **Open pgAdmin**

   - Enter the master password if prompted

2. **Create a Database**

   - Navigate: `Servers > PostgreSQL > Databases`
   - Right-click `Databases` → `Create` → `Database`
   - Name it: `petneo`
   - Click `Save`

3. **Create Tables and Seed Data**

   - Navigate: `petneo > Schemas > public`
   - Right-click `public` → `Query Tool`
   - Paste and run the following SQL:

```sql
-- Home Content Table
DROP TABLE IF EXISTS home_content;

CREATE TABLE home_content (
    screen_id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT NOT NULL
);

INSERT INTO home_content (screen_id, title, description, image_url)
VALUES
(1, 'home', 'home screen', 'https://petneostorage.blob.core.windows.net/images/home_screen_1.PNG'),
(2, 'Welcome to PetNeo - Connecting Pets & Vets', 'One-stop app for pet care, health, and happiness.', 'https://petneostorage.blob.core.windows.net/images/home_screen_2.PNG'),
(3, 'Book & Manage Vet Appointments', 'Find trusted vets nearby, schedule visits, or consult online — anytime.', 'https://petneostorage.blob.core.windows.net/images/home_screen_3.PNG'),
(4, 'Stay on Top of Your Pet’s Health', 'Keep records, get vaccination reminders, and manage treatments in one place.', 'https://petneostorage.blob.core.windows.net/images/home_screen_4.PNG'),
(5, 'Shop Essentials & Discover Services', 'From food to wellness products — get everything your pet needs.', 'https://petneostorage.blob.core.windows.net/images/home_screen_5.PNG'),
(6, 'Expand Your Practice', 'Connect with more pet parents, offer online consults, and simplify your schedule.', 'https://petneostorage.blob.core.windows.net/images/home_screen_6.PNG'),
(7, 'Stronger Together for Pets', 'Empowering pet parents & vets to keep pets healthy and happy.', 'https://petneostorage.blob.core.windows.net/images/home_screen_7.PNG');

-- Services Table
DROP TABLE IF EXISTS services;

CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

INSERT INTO services (name)
VALUES
('Grooming'),
('Boarding'),
('Vet');

```

---

## 🐍 3. Python Project Setup

### Clone the Backend Code

```bash
git clone <your-repo-url>
```

### Open in PyCharm

Navigate to the cloned directory and open in PyCharm.

### Configure Environment Variables

In the `Backend` folder, create or edit the `.env` file:

```env
DB_USERNAME=your_postgres_username
DB_PASSWORD=your_postgres_password
DB_NAME=petneo
DB_PORT=5432
DB_HOST=localhost
```

### Create Virtual Environment (Recommended)

```bash
python -m venv venv
source venv/bin/activate     # On Windows: venv\Scripts\activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

---

## 🚀 4. Run the Backend Server

```bash
uvicorn main:app --reload
```

You’ll see:

```
Uvicorn running on http://127.0.0.1:8000
```

### Test the API

- Open browser: [http://localhost:8000/docs](http://localhost:8000/docs) → **Swagger UI**
- Optional: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🌐 5. Expose Public URL Using Ngrok (Optional)

1. Download ngrok: [https://ngrok.com/download](https://ngrok.com/download)
2. Run the following command:

```bash
ngrok http 8000
```

3. Ngrok will give you a public URL like:

```
https://abcd1234.ngrok.io
```

- Visit: `https://abcd1234.ngrok.io/docs` to share API docs externally

---

## ✅ Summary of Commands

| Task             | Command                                                       |
| ---------------- | ------------------------------------------------------------- |
| Create venv      | `python -m venv venv`                                         |
| Activate venv    | `source venv/bin/activate` (Windows: `venv\Scripts\activate`) |
| Install packages | `pip install -r requirements.txt`                             |
| Run backend      | `uvicorn main:app --reload`                                   |
| View docs        | [http://localhost:8000/docs](http://localhost:8000/docs)      |
| Make public      | `ngrok http 8000`                                             |

---

All set! 🎉 Your backend is ready to develop, test, and deploy.

