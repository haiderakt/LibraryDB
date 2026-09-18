from fastapi import FastAPI
from contextlib import asynccontextmanager
from db_queries import Queries
from basemodels import Book, Customer

queries = Queries()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await queries.pool.open()
    yield
    await queries.pool.close()

app = FastAPI(lifespan=lifespan)

# all books
@app.get("/books")
async def get_books():
    return await queries.get_books()

# search book
@app.get("/books/search")
async def search_book(title:str):
    return await queries.search_book(title)

# add in books
@app.post("/books") 
async def create_book(book: Book):
    return await queries.create_book(book.title, book.author)

# delete book
@app.delete("/books/{book_id}")
async def delete_book(book_id:int):
    return await queries.delete_book(book_id)

# all customers
@app.get("/customer")
async def get_customer():
    return await queries.get_customer()

# search customer
@app.get("/customer/search")
async def search_customer(name:str):
    return await queries.search_customer(name)

# add in customer
@app.post("/customer")
async def create_customer(customer: Customer):
    return await queries.create_customer(customer.name, customer.email)

# delete customer
@app.delete("/customer/{customer_id}")
async def delete_customer(customer_id: int):
    return await queries.delete_customer(customer_id)

# all borrowed
@app.get("/borrowed")
async def get_borrowing():
    return await queries.get_borrowing()

# search borrowed
@app.get("/borrowed/search")
async def search_borrowing(customer_name: str):
    return await queries.search_borrowing(customer_name)

#add in borrowed
@app.put("/borrowed")
async def create_borrowing(customer_id:int, book_id:int):
    return await queries.create_borrowing(customer_id, book_id)

# delete borrowing(returned book)
@app.put("/borrowed/{borrowed_id}/return")
async def delete_borrowing(borrowed_id: int):
    return await queries.delete_borrowing(borrowed_id)
