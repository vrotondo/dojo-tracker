import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Connect to PostgreSQL server
conn = psycopg2.connect(
    host="localhost",
    port="5434",
    database="postgres",  # Connect to default database first
    user="postgres",
    password="LazerDog@91!"
)

# Set autocommit mode
conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)

# Create database
cursor = conn.cursor()
cursor.execute("CREATE DATABASE dojotracker;")
print("✅ Database 'dojotracker' created successfully!")

cursor.close()
conn.close()