from psycopg_pool import AsyncConnectionPool
import os
from dotenv import load_dotenv
from psycopg.rows import dict_row

load_dotenv()

DB_URL = os.environ["DATABASE_URL"]

class Queries:

    def __init__(self):
        self.pool = AsyncConnectionPool(
            conninfo=DB_URL,
            min_size=1,
            max_size=10,
            open=False
        )

    async def get_books(self):
        async with self.pool.connection() as conn:
            conn.row_factory = dict_row
                
            async with conn.cursor() as cur:
                await cur.execute("SELECT * FROM book")
                books = await cur.fetchall()

        return books

    async def search_book(self, title):
        async with self.pool.connection() as conn:
            conn.row_factory = dict_row

            async with conn.cursor() as cur:
                await cur.execute(
                    """
                    SELECT * FROM book
                    WHERE title ILIKE %s
                    """,
                    (f"%{title}%",)
                )
                results = await cur.fetchall()

            return results

    async def create_book(self, title, author):
        async with self.pool.connection() as conn:
            conn.row_factory = dict_row

            async with conn.cursor() as cur:
                await cur.execute(
                       """
                       INSERT INTO book (title, author)
                        VALUES (%s, %s)
                        RETURNING *; 
                       """,
                       (title, author)
                  )
                results = await cur.fetchall()

            await conn.commit()
              
        return results


    async def delete_book(self, id):
        async with self.pool.connection() as conn:
            conn.row_factory = dict_row

            async with conn.cursor() as cur:
                await cur.execute(
                    """
                    DELETE FROM book
                    WHERE id = %s
                    RETURNING*;
                    """,
                    (id,)
                )

                results = await cur.fetchall()

            await conn.commit()

        return results


    async def get_customer(self):
        async with self.pool.connection() as conn:
            conn.row_factory = dict_row

            async with conn.cursor() as cur:
                await cur.execute(
                    """
                    SELECT * FROM customer;
                    """
                )

                results = await cur.fetchall()

        return results