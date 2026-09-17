from fastapi import FastAPI
from db_queries import Queries

queries = Queries()
app = FastAPI()


@app.get("/books")
async def get_books():
    pass

