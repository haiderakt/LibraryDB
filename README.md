# Library API

A library management application with a FastAPI backend, PostgreSQL persistence, JWT authentication, and a Vite frontend.

## Features

- JWT login with access and refresh tokens
- Book management
- Customer management
- Borrowing and book returns
- Search for books, customers, and borrowing records
- Responsive library dashboard

## Project Structure

```text
.
├── app.py                 # FastAPI routes
├── auth.py               # JWT authentication helpers
├── basemodels.py         # Pydantic request models
├── db_queries.py         # PostgreSQL queries and connection pool
├── requirements.txt      # Python dependencies
└── frontend/              # Vite frontend
    ├── src/main.js
    ├── src/styles.css
    ├── .env
    └── vite.config.js
```

## Requirements

- Python 3.14 or compatible Python version
- PostgreSQL
- Node.js and npm

The database must contain the tables used by the application: `users`, `book`, `customer`, and `borrowed`. PostgreSQL's `pgcrypto` extension is required for password verification with `crypt()`.

## Backend Setup

Create and activate a virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate
```

Install the Python dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file in the project root. Do not commit it:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/library
SECRET_KEY=replace-with-a-long-random-secret
REFRESH_TOKEN_SECRET=replace-with-another-long-random-secret
REFRESH_TOKEN_EXPIRE_DAYS=7
```

Start the API:

```bash
uvicorn app:app --reload
```

The API runs at [http://127.0.0.1:8000](http://127.0.0.1:8000).

## Frontend Setup

The frontend uses a separate configuration file at `frontend/.env`:

```env
VITE_API_BASE_URL=/api
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

Start the frontend in a second terminal:

```bash
npm run dev -- --host 127.0.0.1
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

The Vite development proxy forwards `/api/*` requests to the backend at `http://127.0.0.1:8000`.

## Authentication

Sign in through the frontend login screen. The frontend sends credentials to `POST /login` as form-encoded data:

```text
username=...&password=...
```

Authenticated requests include:

```http
Authorization: Bearer <access_token>
```

When an access token expires, the frontend uses `POST /refresh` with the stored refresh token and retries the original request once.

## API Routes

### Authentication

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/login` | Authenticate with username and password |
| `POST` | `/refresh` | Create a new access token |

### Books

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/books` | List books |
| `GET` | `/books/search?title=...` | Search books by title |
| `POST` | `/books` | Create a book |
| `DELETE` | `/books/{book_id}` | Delete a book |

### Customers

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/customer` | List customers |
| `GET` | `/customer/search?name=...` | Search customers by name |
| `POST` | `/customer` | Create a customer |
| `DELETE` | `/customer/{customer_id}` | Delete a customer |

### Borrowing

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/borrowed` | List borrowing records |
| `GET` | `/borrowed/search?customer_name=...` | Search by customer name |
| `PUT` | `/borrowed?customer_id=...&book_id=...` | Borrow a book |
| `PUT` | `/borrowed/{borrowed_id}/return` | Return a book |

All routes except `/login` and `/refresh` require a bearer access token.

## Frontend Build

Create a production build with:

```bash
cd frontend
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Security Notes

- Keep `.env` out of version control.
- Use long, randomly generated values for `SECRET_KEY` and `REFRESH_TOKEN_SECRET`.
- Do not share or commit database credentials or JWT tokens.
