# 🛍️ Retail Management System (RMS)

> **Educational Project — built for learning purposes only (not production-ready).**

A simplified **Retail / POS system** consisting of a **.NET 8 Web API** backend and a **React + Redux Toolkit + RTK Query** frontend.  
This project demonstrates how to structure a full-stack retail application covering **authentication**, **products & inventory**, **discounts & coupons**, **orders & POS**, **customers**, and **auditing**.

---

## ⚠️ Disclaimer — Educational Use Only

This codebase is created **strictly for learning purposes**.  
It intentionally omits production-grade elements such as:
- Strong security and encryption practices  
- Comprehensive validation and exception handling  
- Payment gateway integrations  
- Data protection and audit compliance  


---

## 🧱 Tech Stack

### **Backend**
- ASP.NET Core **.NET 8 Web API**
- Entity Framework Core (Code First)
- Microsoft SQL Server
- JWT-based authentication (simplified)

### **Frontend**
- React (Vite + TypeScript)
- Redux Toolkit & RTK Query (for state & API management)
- Bootstrap & Tailwind for styling

### **Other**
- RESTful API architecture  
- JSON-based communication  
- CORS-enabled for local dev (`http://localhost:5173`)

---

## 🗂️ Project Structure

```plaintext
RMS/
├─ backend/                             # ASP.NET Core API
│  ├─ RetailManagementSystem.sln
│  ├─ RetailManagementSystem/
│  │  ├─ Controllers/                   # API controllers
│  │  ├─ Domain/                        # Entity models
│  │  ├─ Dtos/                          # Data transfer objects
│  │  ├─ Data/                          # DbContext & configuration
│  │  ├─ Services/                      # Business logic & helpers
│  │  ├─ Program.cs
│  │  ├─ appsettings.json
│  │  └─ Migrations/                    # EF Core migrations
│
└─ frontend/                            # React application
   └─ fr-rms-ui/
      ├─ src/
      │  ├─ features/
      │  │  ├─ products/                # Product & category UI
      │  │  ├─ inventory/               # Inventory view
      │  │  ├─ orders/                  # POS module
      │  │  ├─ discounts/               # Discounts, coupons
      │  │  └─ auth/                    # Login, registration
      │  ├─ app/                        # Redux store, API setup
      │  └─ main.tsx                    # Entry point
      ├─ index.html
      └─ vite.config.ts
```

---

## 🧩 Features Overview

- ✅ Role-based access (Admin / Manager / Salesman)  
- ✅ Product & Category CRUD  
- ✅ Stock tracking via Inventory and StockLedger  
- ✅ POS Order flow (Unpaid → Paid → Voided)  
- ✅ Coupon & discount support  
- ✅ Customer records with multiple phones  
- ✅ Audit logging for system actions  

---

## 🧪 Sample API Endpoints

| Method | Endpoint | Description |
|--------|-----------|-------------|
| POST | `/api/auth/login` | User login (returns JWT) |
| GET | `/api/products/search?q=milk` | Search active products |
| POST | `/api/orders` | Create draft order |
| GET | `/api/orders/{id}` | Get order details |
| POST | `/api/orders/{id}/items` | Add product to order |
| PUT | `/api/orders/{id}/items/{itemId}` | Update item quantity |
| DELETE | `/api/orders/{id}/items/{itemId}` | Remove order item |
| POST | `/api/orders/{id}/pay` | Mark order as paid |
| POST | `/api/orders/{id}/void` | Void unpaid order |

---

## 🧠 Learning Objectives

This project helps learners understand:
- Backend CRUD + DTO + EF Core workflows  
- REST API design in ASP.NET Core  
- State management with Redux Toolkit  
- Integration using RTK Query  
- POS-like UI design patterns  
- Role-based access & modular structure  

---

## 🧾 Notes

- Some endpoints may require JWT tokens.  
- Make sure backend CORS allows your frontend origin (`http://localhost:5173`).  
- Adjust URLs in frontend `.env` as needed.  
- Data models and flows are intentionally simplified for learning.

---

## ✨ Author

**Isindu Wijesinghe**  
📧 _Intern / Student Project — for educational purposes_  
🌐 [GitHub Profile](https://github.com/iszzy0wijesinghe)

