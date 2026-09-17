from fastapi import FastAPI
from contextlib import asynccontextmanager
from db_queries import Queries

queries = Queries()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await queries.pool.open()
    yield
    await queries.pool.close()

app = FastAPI(lifespan=lifespan)


@app.get("/books")
async def get_books():
    return await queries.get_books()

