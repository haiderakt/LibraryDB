from fastapi import FastAPI
from db_queries import Queries
import asyncio

queries = Queries()
app = FastAPI()


@app.get("/books")
async def get_books():
    all_books = await queries.get_books()
    return all_books

