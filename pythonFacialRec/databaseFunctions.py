import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv
import os

load_dotenv()

db_name = os.getenv("DB_DATABASE")
db_user = os.getenv("DB_USERNAME")
db_password = os.getenv("DB_PASSWORD")
db_host = os.getenv("DB_HOST")
db_port = os.getenv("DB_PORT")

def connectDatabase():

    conn = None

    try:
        conn = psycopg2.connect(
            dbname = db_name,
            user=db_user,
            password=db_password,
            host=db_host,
            port=db_port
        )

        print("Connection Successful")

    except Exception as e:
        print("Error connecting to database:", e)
    finally:
        return conn

def insertFaceAuthentication(feature_vector, last_used, user_id):
    # Connect to the database
    conn = connectDatabase()
    if conn is None:
        return

    try:
        # Create a cursor object
        cursor = conn.cursor()

        # SQL statement to insert a new entry
        insert_query = sql.SQL("""
            INSERT INTO faceAuthentication (featureVector, lastUsed, userID)
            VALUES (%s, %s, %s)
            RETURNING faceID;
        """)

        # Execute the insert query
        cursor.execute(insert_query, (feature_vector, last_used, user_id))

        # Fetch the generated faceID
        face_id = cursor.fetchone()[0]
        print(f"Inserted new entry with faceID: {face_id}")

        # Commit the changes
        conn.commit()

    except Exception as e:
        print("Error inserting into faceAuthentication:", e)
        conn.rollback()  # Rollback in case of error
    finally:
        # Close the cursor and connection
        cursor.close()
        conn.close()
        print("Connection closed.")

def getUserFacialData(userID):
    conn = connectDatabase()
    if conn is None:
        return

    try:
        cursor = conn.cursor()

        select_query = sql.SQL("""
            select featureVector from faceAuthentication where
            userID = %s;
        """)

        cursor.execute(select_query, (userID,))

        feature_vector = cursor.fetchall()

        return feature_vector

    except Exception as e:
        print("Error fetching user facial data:", e)
    finally:
        cursor.close()
        conn.close()
        print("Connection closed.")




