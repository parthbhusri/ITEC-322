# Campus Rental Hub — Backend

A RESTful backend API for a student rental platform that allows university students to list, discover, and rent textbooks, equipment, and other campus essentials.

Built using **FastAPI, Python, PostgreSQL, SQLAlchemy, and Stripe Checkout**.

## Features

- User registration and authentication
- Secure password hashing and JWT authentication
- User profile management
- Item listing and discovery
- Rental booking creation and management
- Booking approval and rejection
- Rental start, completion, and cancellation
- Overlapping booking prevention
- Stripe Checkout integration for rental payments
- Payment status tracking
- Interactive API documentation using Swagger UI

## Technology Stack

| Technology | Purpose |
|---|---|
| Python | Backend programming language |
| FastAPI | REST API framework |
| PostgreSQL | Relational database |
| SQLAlchemy | Database ORM |
| Pydantic | Request and response validation |
| JWT | User authentication |
| Argon2 | Password hashing |
| Stripe | Sandbox payment integration |

## Project Structure

```text
campus-rental-hub-backend/
├── app/
│   ├── auth.py
│   ├── database.py
│   ├── main.py
│   ├── models.py
│   ├── rentals.py
│   ├── schemas.py
│   ├── security.py
│   └── stripe_payments.py
├── requirements.txt
├── seed_products.py
├── .gitignore
└── README.md
```

## Local Setup

Clone the repository:

```bash
git clone https://github.com/ArshdeepKaur012003/campus-rental-hub-backend.git
cd campus-rental-hub-backend
```

Create and activate a Python virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

Configure a local PostgreSQL database and create a `.env` file containing the required database connection, JWT configuration, and Stripe test credentials.

**Never commit `.env` or secret keys to GitHub.**

Start the backend:

```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

## API Documentation

Once the backend is running, visit:

http://127.0.0.1:8001/docs

This provides interactive Swagger UI documentation for testing the available endpoints.

## Rental Workflow

1. A student registers and logs in.
2. The student browses available items.
3. The student submits a rental booking request.
4. The item owner approves or rejects the request.
5. An approved booking can proceed to Stripe Checkout.
6. Successful payments are recorded against the rental.
7. The rental can be started and completed through the booking workflow.

## Payment Integration

Stripe Checkout is integrated in sandbox mode for testing rental payments.

The backend includes a webhook endpoint for processing successful Checkout sessions. Automatic webhook delivery and payment reconciliation require correct Stripe webhook configuration and end-to-end testing.

## Frontend Repository

The Next.js frontend is maintained separately:

https://github.com/ArshdeepKaur012003/campus-rental-hub-frontend

## Project Status

The backend supports core authentication, item management, rental booking workflows, and Stripe sandbox Checkout. Further testing and improvements are ongoing.

## Author

Arshdeep Kaur

Bachelor of Information Technology
