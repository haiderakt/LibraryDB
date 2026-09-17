from psycopg_pool import ConnectionPool
import psycopg
import os
from fastapi import FastAPI

DB_URL = os.environ("DATABASE_URL")

class Queries:

    async def __init__(self):
        self.pool = ConnectionPool(
            conninfo=os.environ["DATABASE_URL"],
            min_size=1,
            max_size=10,
        )

    async def get_books(self):
          async with await psycopg.AsyncConnection.connect(DB_URL) as conn:
                async with conn.cursor() as cur:
                    await cur.execute("SELECT * FROM book")
                    books = await cur.fetchall()

                return books
