from app import create_app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=5000)

    # when in doubt, type this in the terminal to create a database: & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -p 5434 -c "CREATE DATABASE dojotracker;"