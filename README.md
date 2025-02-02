### 📌 FAQ Management API - README

## 📌 Project Overview

This is a backend API for managing FAQs with multi-language translation support. It allows admins to create, update, and delete FAQs while supporting real-time translations. Redis caching ensures fast responses, and JWT authentication is implemented to secure admin operations.

---

## 🚀 Tech Stack

- **Node.js with Express.js**
- **TypeScript**
- **PostgreSQL (Hosted on NeonDB)**
- **Prisma ORM**
- **Redis (Using Docker)**
- **JWT Authentication**
- **Docker (Only for Redis)**

---

## ⚙️ Setup & Installation

### 1️⃣ Clone the repository:
```sh
git clone https://github.com/your-username/faq-api.git
cd faq-api
```

### 2️⃣ Install dependencies:
```sh
npm install
```

### 3️⃣ Set up environment variables:
Create a `.env` file in the root directory and add:
```env
DATABASE_URL=your_postgresql_url
JWT_SECRET=your_jwt_secret
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 4️⃣ Start Redis using Docker:
```sh
docker run --name redis-container -p 6379:6379 -d redis
```

### 5️⃣ Run database migrations:
```sh
npx prisma migrate dev --name init
```

### 6️⃣ Start the server:
```sh
npm run dev
```

---

## 🔑 Authentication

All admin actions require a valid JWT token in the `Authorization` header.

### 1️⃣ Signup
**POST** `/api/v1/auth/signup`
```json
{
    "fullName": "guest",
    "email": "guest@gmail.com",
    "password": "123456",
    "role": "admin" or "user"
}
```
✅ **Response:**
```json
{
    "message": "User created successfully",
    "success": true
}
```

### 2️⃣ Login
**POST** `/api/v1/auth/login`
```json
{
  "email": "admin@example.com",
  "password": "securepassword"
}
```
✅ **Response:**
```json
{
    "message": "Login Successful",
    "success": true,
    "token": "your generated token"
}
```

---

## 📖 API Endpoints

### 🔹 FAQ Management

### 3️⃣ Create FAQ
**POST** `/api/v1/faqs/`
Headers: `{ "Authorization": "Bearer jwt_token" }`
```json
{
  "question": "What is the refund policy?",
  "answer": "You can request a refund within 30 days."
}
```
✅ **Response:**
```json
{ "message": "FAQ created successfully", "faq": {}, "success": true }
```

### 4️⃣ Get FAQs (With Translation Support)
**GET** `/api/v1/faqs/?lang=hi`
✅ **Response:**
```json
{
  "success": true,
  "faqs": [
    { "question": "क्या है रिफंड नीति?", "answer": "आप 30 दिनों के भीतर रिफंड का अनुरोध कर सकते हैं।" }
  ]
}
```

### 5️⃣ Update FAQ
**PUT** `/api/v1/faqs/:id`
Headers: `{ "Authorization": "Bearer jwt_token" }`
```json
{
  "question": "Updated question",
  "answer": "Updated answer"
}
```
✅ **Response:**
```json
{ "message": "FAQ updated successfully", "success": true }
```

### 6️⃣ Delete FAQ
**DELETE** `/api/v1/faqs/:id`
Headers: `{ "Authorization": "Bearer jwt_token" }`
✅ **Response:**
```json
{ "message": "FAQ deleted successfully", "success": true }
```

---

## ⚡ Caching Strategy

- Redis stores FAQs for each language (`faqs:en`, `faqs:hi`, etc.).
- On a new FAQ creation, update, or delete, the cache is invalidated.
- Fetching FAQs first checks Redis; if not found, fetch from DB & cache result.

---

## 📖 Database Schema (Prisma Models)

```prisma
model FAQ {
  id          Int     @id @default(autoincrement())
  question    String
  answer      String
  lang        String
  createdBy   Int
  originalId  Int?   // Used for translations
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  admin       User    @relation(fields: [createdBy], references: [id])
}

model User {
  id       Int     @id @default(autoincrement())
  fullName String
  email    String  @unique
  password String 
  role     String  @default("user") // admin or user , admin can modify faqs and user can view
  faqs     FAQ[]
}
```

---

## 🧪 Running Tests

```sh
npm run test
```

---

