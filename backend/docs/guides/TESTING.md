# Testing Registration Endpoint

## Quick Start

### 1. Setup Environment

Create a `.env` file in the backend directory:

```bash
# Copy from example
copy .env.example .env
```

Edit `.env` and set your `DATABASE_URL`. For quick testing with SQLite:
```
DATABASE_URL=sqlite:///./synth_studio.db
```

Or for PostgreSQL:
```
DATABASE_URL=postgresql://user:password@localhost:5432/synth_studio
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Create Database Tables

```bash
python -m app.database.create_tables
```

This will create all necessary tables including the `users` table.

### 4. Start the Server

#### Option A: Using the batch file
```bash
start_server.bat
```

#### Option B: Direct uvicorn command
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Test the Registration

Once the server is running:

1. Open your browser and go to: http://localhost:8000/docs
2. This will open the FastAPI Swagger UI (API documentation)
3. Expand the **Authentication** section
4. Click on **POST /auth/register**
5. Click "Try it out"
6. Enter a test user:
   ```json
   {
     "email": "test@example.com",
     "password": "testpassword123"
   }
   ```
7. Click "Execute"

You should receive a 201 response with the created user data (without the password).

### Available Endpoints

- `GET /` - Root health check
- `GET /health` - Health check endpoint  
- `GET /auth/ping` - Auth module health check
- `POST /auth/register` - Register a new user

### Testing with cURL (Alternative)

```bash
curl -X POST "http://localhost:8000/auth/register" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"testpassword123\"}"
```

## Changes Made

### main.py
- ✅ Cleaned up and simplified
- ✅ Removed redundant try-except blocks
- ✅ Added proper FastAPI configuration
- ✅ Added startup/shutdown event handlers
- ✅ Better logging of registered routes

### api.py
- ✅ Simplified router inclusion
- ✅ Currently only includes auth router (for registration testing)
- ✅ Other routers are commented out for future implementation
- ✅ Better error logging

### auth/routes.py
- ✅ Added proper HTTP status codes
- ✅ Added comprehensive API documentation
- ✅ Better error messages
- ✅ Improved endpoint descriptions for Swagger UI

## Next Steps

After testing registration:
1. Add login endpoint
2. Add JWT token generation
3. Add protected endpoints
4. Uncomment other routers in `api.py` as you implement them
