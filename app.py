from fastapi import FastAPI
from contextlib import asynccontextmanager
from db_queries import Queries
from basemodels import Book

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
@app.get("/customers")
async def get_customer():
    return await queries.get_customer()

# search customer
