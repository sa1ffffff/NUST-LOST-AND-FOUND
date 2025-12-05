🔍 NUST Finder – Centralized Lost & Found Platform
NUST Finder is a full-stack web application designed to solve the problem of scattered lost & found reports across campus. It provides a centralized, searchable, and secure platform for students to report lost items and reunite with their belongings efficiently.

🚀 The Problem & Solution
Previously, lost items were reported in chaotic WhatsApp groups or Facebook pages, making retrieval difficult. I built this solution to offer:

Structured Reporting: Dedicated forms for Lost vs. Found items.

Visual Verification: Image uploads to verify item ownership.

Instant Notification: Automated email alerts when an item is marked as found.

🛠️ Tech Stack
Frontend:

React (Vite): For a fast, responsive Single Page Application (SPA).

TypeScript: For type safety and robust code architecture.

Tailwind CSS: For modern, responsive styling.

Shadcn/UI: For accessible, pre-built component patterns.

Backend & Database:

Supabase (PostgreSQL): Used as the primary database and backend-as-a-service.

Supabase Storage: Securely handles user-uploaded images for lost items.

Row Level Security (RLS): Implemented strict database policies to manage public access vs. admin privileges.

Integrations:

EmailJS: Custom API integration to handle transactional emails without a backend server, ensuring owners are notified immediately when their item is found.

✨ Key Features
1. 🔒 Secure Data Handling (RLS)
Unlike simple CRUD apps, this project uses Row Level Security policies in PostgreSQL.

Public users can insert reports but cannot modify others' data.

Specific "Update" policies were written to allow the "Mark as Found" feature to function securely without exposing the entire database.

2. 📧 Automated Email Notification System
I engineered a direct integration with EmailJS to close the loop on lost items.

When a user clicks "Mark as Found," the app triggers an API call.

The system dynamically pulls the owner's contact info and sends a templated email with the item details and description.

3. ⚡ Real-Time & Reactive UI
Optimistic UI Updates: The interface updates instantly when an item is marked found, providing immediate feedback while the database processes in the background.

Smart Search: Real-time filtering by location, title, or description.

📸 Snapshots
<img width="796" height="570" alt="image" src="https://github.com/user-attachments/assets/36802723-086c-491f-ad5d-34e68ded9851" />


💿 How to Run Locally
Clone the repo

Bash

git clone https://github.com/your-username/nust-finder.git
cd nust-finder
Install Dependencies

Bash

npm install
Configure Environment Create a .env file and add your Supabase & EmailJS keys:

Code snippet

VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_key
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
Run the Server

Bash

npm run dev
