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

def insertFaceAuthentication(feature_vector, last_used, user_id, salt):
    # Connect to the database
    conn = connectDatabase()
    if conn is None:
        return

    try:
        # Create a cursor object
        cursor = conn.cursor()

        # SQL statement to insert a new entry
        insert_query = sql.SQL("""
            INSERT INTO faceAuthentication (featureVector, lastUsed, userID, salt)
            VALUES (%s, %s, %s, %s)
            RETURNING faceID;
        """)

        # Execute the insert query
        cursor.execute(insert_query, (feature_vector, last_used, user_id, salt))

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
            select featureVector, salt from faceAuthentication where
            userID = %s;
        """)

        cursor.execute(select_query, (userID,))

        feature_vector = cursor.fetchone()

        return feature_vector

    except Exception as e:
        print("Error fetching user facial data:", e)
    finally:
        cursor.close()
        conn.close()
        print("Connection closed.")

def checkIfUserHasFacialData(userID):
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

        feature_vector = cursor.fetchone()

        return feature_vector is not None

    except Exception as e:
        print("Error fetching user facial data:", e)
        return False
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
        print("Connection closed.")

def updateScanned(userID, boolean):
    conn = connectDatabase()
    if conn is None:
        return

    try:
        cursor = conn.cursor()

        update_query = sql.SQL("""
            UPDATE userinfo
            SET faceScanned = %s
            where userID = %s;
        """)

        cursor.execute(update_query, (boolean, userID))

        conn.commit()

    except Exception as e:
        print("Error fetching user facial data:", e)
        return False
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
        print("Connection closed.")
    return True

def updateFaceAuthentication(feature_vector, last_used, user_id, salt):
    # Connect to the database
    conn = connectDatabase()
    if conn is None:
        return

    try:
        # Create a cursor object
        cursor = conn.cursor()

        # SQL statement to insert a new entry
        update_query = sql.SQL("""
            UPDATE faceAuthentication
            SET featureVector = %s, salt = %s, lastUsed = %s
            WHERE userID = %s
        """)

        # Execute the insert query
        cursor.execute(update_query, (feature_vector, salt, last_used, user_id))

        # Commit the changes
        conn.commit()
        print(f"updated info in faceAuthentication with userID {user_id}")


    except Exception as e:
        print("Error updating faceAuthentication:", e)
        conn.rollback()  # Rollback in case of error
    finally:
        # Close the cursor and connection
        cursor.close()
        conn.close()
        print("Connection closed.")


