import psycopg2

try:
    # Update these with your actual values
    conn = psycopg2.connect(
        host="localhost",
        port="5434",  # Your port
        database="postgres",  # Default database
        user="postgres",
        password="LazerDog@91!"  # Replace with your actual password / encoded: LazerDog%4091%21
    )
    print("✅ PostgreSQL connection successful!")
    print(f"PostgreSQL version: {conn.server_version}")
    conn.close()
except Exception as e:
    print(f"❌ Connection failed: {e}")