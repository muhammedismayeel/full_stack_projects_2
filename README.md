PocketPulse – Personal Finance Tracker

A simple full-stack web app to track your daily income and expenses, calculate daily, monthly, and lifetime balances, and visualize your financial history.

Features

Add, edit, and delete transactions (income/expense)

View daily, monthly, and lifetime balance summaries

Filter transactions by type or search by description/category

Interactive chart showing last 7 days of income and expenses

Demo data seeding for quick testing

Data stored securely in MySQL database

Tech Stack

Frontend: HTML, CSS, JavaScript (vanilla), Chart.js

Backend: Node.js, Express.js

Database: MySQL

Optional Hosting: Render.com, PlanetScale, Netlify/Vercel

Project Structure
personal-finance-web-app/
│
├─ backend/
│   ├─ server.js           # Node.js backend
│   ├─ package.json
│   └─ ...                 # other backend files
│
├─ frontend/
│   ├─ index.html
│   ├─ js.js               # main frontend JS
│   ├─ style.css
│   └─ ...
│
├─ .gitignore
└─ README.md

Setup & Installation
Prerequisites

Node.js & npm installed

MySQL installed or use a cloud database (e.g., PlanetScale, Render MySQL)

Steps

Clone the repo

git clone https://github.com/USERNAME/REPO_NAME.git
cd REPO_NAME


Install backend dependencies

cd backend
npm install


Create MySQL database

CREATE DATABASE pocketpulse;


Create transactions table

CREATE TABLE transactions (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(10) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(50),
  description VARCHAR(255),
  date DATE NOT NULL
);


Configure environment variables in .env:

DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
DB_NAME=pocketpulse
PORT=4000


Run the backend

node server.js


Open frontend in browser

Open index.html from frontend folder or serve via local server

Usage

Add a transaction → choose Income or Expense → fill amount, category, description, and date → click Submit

Filter transactions or search using the top bar

View summary and charts to track your finances

Demo Data

Click Seed Demo to automatically populate sample transactions for testing

Contributing

Fork the repo

Create a new branch: git checkout -b feature-name

Commit your changes: git commit -m "Add some feature"

Push: git push origin feature-name

Create a pull request

License

This project is open-source under the MIT License.

node.js file i did't in add because it has my MYSQL password 
