from fastapi import FastAPI
from db_queries import get_books


app = FastAPI()


@app.get("/books")
async def get_books():
    pass

