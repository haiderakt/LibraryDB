from fastapi import FastAPI, Depends, HTTPException 
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from db_queries import Queries 
from basemodels import Book, Customer, RefreshRequest
from fastapi.security import OAuth2PasswordRequestForm 
from auth import (
    get_current_user,
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
    required_role
)

queries = Queries()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await queries.pool.open()
    yield
    await queries.pool.close()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):

    user = await queries.get_user(form_data.username, form_data.password)
    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password"
        ) #error handling for wrong credentials
    
    token = create_access_token(
        user["username"],
        user["role"]
    )

    refresh_token = create_refresh_token(
        user["username"],
        user["role"]
)

    return {"access_token":token, "refresh_token":refresh_token, "token_type":"bearer"}

# refresh token endpoint
@app.post("/refresh")
async def refresh(data: RefreshRequest):
    refresh_token = data.refresh_token
    payload = verify_refresh_token(refresh_token)

    access_token = create_access_token(
    payload["username"],
    payload["role"]
)

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# all books
@app.get("/books")
async def get_books(_ = Depends(get_current_user)):
    return await queries.get_books()

# search book
@app.get("/books/search")
async def search_book(title:str, _=Depends(get_current_user)):
    return await queries.search_book(title)

# add in books
@app.post("/books") 
async def create_book(book: Book, _=Depends(required_role("admin"))):
    return await queries.create_book(book.title, book.author, book.price)

# delete book
@app.delete("/books/{book_id}")
async def delete_book(book_id:int, _=Depends(required_role("admin"))):
    return await queries.delete_book(book_id)

# all customers
@app.get("/customer")
async def get_customer(_=Depends(required_role("admin", "librarian"))):
    return await queries.get_customer()

# search customer
@app.get("/customer/search")
async def search_customer(name:str, _=Depends(required_role("admin", "librarian"))):
    return await queries.search_customer(name)

# add in customer
@app.post("/customer")
async def create_customer(customer: Customer, _=Depends(required_role("admin", "librarian"))):
    return await queries.create_customer(customer.name, customer.email)

# delete customer
@app.delete("/customer/{customer_id}")
async def delete_customer(customer_id: int, _=Depends(required_role("admin"))):
    return await queries.delete_customer(customer_id)

# all borrowed
@app.get("/borrowed")
async def get_borrowing(_=Depends(required_role("admin", "librarian"))):
    return await queries.get_borrowing()

# search borrowed
@app.get("/borrowed/search")
async def search_borrowing(customer_name: str, _=Depends(required_role("admin", "librarian"))):
    return await queries.search_borrowing(customer_name)

#add in borrowed
@app.put("/borrowed")
async def create_borrowing(customer_id:int, book_id:int, _=Depends(required_role("admin", "librarian"))):
    result =  await queries.create_borrowing(customer_id, book_id)
    if result is None:
        raise HTTPException(
            status_code=409,
            detail="Book is already borrowed"
        )
    return result

# delete borrowing(returning book)
@app.put("/borrowed/{borrowed_id}/return")
async def return_borrowing(borrowed_id: int, _=Depends(required_role("admin", "librarian"))):
    result = await queries.return_borrowing(borrowed_id)

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Borrowing not found or book has already been returned"
        )
    return result

@app.get("/accounting")
async def get_accounting(_=Depends(required_role("admin"))):
    return await queries.get_accounting()


@app.get("/accounting/total")
async def get_total_accounting(_=Depends(required_role("admin"))):
    return await queries.get_total_accounting()

