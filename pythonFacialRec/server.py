import asyncio
import facialFunctions
import databaseFunctions
import aiohttp
from aiohttp import web, ClientSession
from PIL import Image
import io
import json
import os
from datetime import datetime
import aiohttp_cors
from cryptoFunctions import UserEncryption

cookieInfoApi = os.getenv("COOKIE_INFO")



async def hello(request):
    return web.Response(text="Hello, World!")

async def init_app():
    app = web.Application()

    # Add routes
    app.router.add_get('/python/', hello)
    app.router.add_post('/python/faceData', firstFaceScan)
    app.router.add_post('/python/compareTwoFaces', compareTwoFaces)
    app.router.add_post('/python/cryptoTest', cryptoTest)


    # Add CORS support to all routes
    cors = aiohttp_cors.setup(app, defaults={
        "http://localhost:8000": aiohttp_cors.ResourceOptions(
            allow_credentials=True,
            expose_headers="*",
            allow_headers="*",
            allow_methods="*"
        ),
        "http://localhost:3000": aiohttp_cors.ResourceOptions(
        allow_credentials=True,
        expose_headers="*",
        allow_headers="*",
        allow_methods="*"
        )
    })



    for route in list(app.router.routes()):
        cors.add(route)

#    app.add_routes(routes)

    return app

async def cookieInfo(cookie):
    #function to access cookie info
    async with aiohttp.ClientSession() as session:
        # Set only the Cookie header with the provided cookie value
        headers = {
            "Cookie": cookie
        }

        try:
            # Make the request to the backend with only the Cookie header
            async with session.get(f"{cookieInfoApi}", headers=headers) as response:
                response.raise_for_status()
                data = await response.json()
                return data
        except Exception as e:
            # Log or handle error if the request fails
            print(f"Failed to fetch data: {response.status}")
            return None


async def firstFaceScan(request):
    # Parse the incoming form data
    cookie_value = request.headers.get("Cookie")  # Extract cookie from incoming request
    if not cookie_value:
        return web.Response(text="No cookie provided", status=400)

    user_info = await cookieInfo(cookie_value)
    if not user_info:
        return web.Response(text="failed to fetch user data from cookie", status=400)

    reader = await request.multipart()

    # Get the uploaded file
    field = await reader.next()

    if field and field.name == 'file':
        image_data = await field.read(decode = True)

        try:
            image = Image.open(io.BytesIO(image_data))

            # Convert the image to RGB
            colored_image = image.convert("RGB")

            # Save processed image to a bytes buffer
            output_buffer = io.BytesIO()
            colored_image.save(output_buffer, format='JPEG')
            output_buffer.seek(0)

            facial_encoding = facialFunctions.get_face_encoding(output_buffer)

            #converting numpy array to python3 list
            facial_encoding_list = facial_encoding.tolist()

            last_used = datetime.now()

            # variable for userID
            userID = user_info['userID']
            userOAuthID = int(user_info['userOAuthID'])


            print(user_info)

            #check to see if face data already in if so skip
            if not databaseFunctions.checkIfUserHasFacialData(userID):
                print("THEY DONT GOT FACE")
#               databaseFunctions.insertFaceAuthentication(facial_encoding_list, last_used, userID)

                encryptedData = await encryptFaceData(facial_encoding_list, userID, userOAuthID)

                #insert encryptedFaceData with salt into database
                databaseFunctions.insertFaceAuthentication(encryptedData[0], last_used, userID, encryptedData[1])


                # Since this is first login the boolean will be TRUE since they logged in
                databaseFunctions.updateScanned(userID, True)

                return web.json_response({
                    "message": "New user successfully created",
                    "redirect_url": "http://localhost:8000/files"
                })
            else:
                print("THEY GOT FACE ALREADY")
                faceRecResults = await compareTwoFaces(userID, facial_encoding_list, userOAuthID)
                if faceRecResults == True:
                    #we insert the new facial data into the database
                    encryptedData = await encryptFaceData(facial_encoding_list, userID, userOAuthID)

                    #insert encryptedFaceData with salt into database
                    databaseFunctions.updateFaceAuthentication(encryptedData[0], last_used, userID, encryptedData[1])

                    #Since compareTwoFaces returns true they are same person
                    #Boolean for updateScanned will be True
                    databaseFunctions.updateScanned(userID, True)

                    return web.json_response({
                        "message": "Face Scan Successful!",
                        "redirect_url": "http://localhost:8000/files"
                     })
                else:
                    return web.Response(text="Face Scan not Successful", status=400)

        except Exception as e:
            return web.Response(text=f"Error processing image: {str(e)}", status=400)

    # Return error if no file was uploaded
    return web.Response(text="No file uploaded.", status=400)

async def compareTwoFaces(userID, facial_encoding_list, userOAuthID):

    try:
        # get info of encryptedFaceData from database related from userID
        # with the encrypted salt as well
        encryptedFaceData, salt = databaseFunctions.getUserFacialData(userID)

        #decrypt the faceData
        faceData = await decryptedFaceData(encryptedFaceData, userID, salt, userOAuthID)

        #print(type(faceData))

        # compare the old face that was encrypted to the new faceData to see if
        # related
        output = facialFunctions.get_face_comparison_result(facial_encoding_list, faceData)

        return output

    except Exception as e:
        return print(e)

async def cryptoTest(request):
    # Parse the incoming form data
    cookie_value = request.headers.get("Cookie")  # Extract cookie from incoming request
    if not cookie_value:
        return web.Response(text="No cookie provided", status=400)

    user_info = await cookieInfo(cookie_value)
    if not user_info:
        return web.Response(text="failed to fetch user data from cookie", status=400)

    reader = await request.multipart()

    # Get the uploaded file
    field = await reader.next()

    if field and field.name == 'file':
        image_data = await field.read(decode = True)

        try:
            image = Image.open(io.BytesIO(image_data))

            # Convert the image to RGB
            colored_image = image.convert("RGB")

            # Save processed image to a bytes buffer
            output_buffer = io.BytesIO()
            colored_image.save(output_buffer, format='JPEG')
            output_buffer.seek(0)

            facial_encoding = facialFunctions.get_face_encoding(output_buffer)

            #converting numpy array to python3 list
            facial_encoding_list = facial_encoding.tolist()

            last_used = datetime.now()

            # variable for userID
            userID = user_info['userID']
            userOAuthID = int(user_info['userOAuthID'])

#            print(facial_encoding_list)


            encryptedFaceData, salt = databaseFunctions.getUserFacialData(userID)

            faceData = await decryptedFaceData(encryptedFaceData, userID, salt, userOAuthID)

            #print(type(faceData))

            output = facialFunctions.get_face_comparison_result(facial_encoding_list, faceData)

            print(output)



           # this section is for encrypting

            #encryptedData = await encryptFaceData(facial_encoding_list, userID, userOAuthID)

            #insert encryptedFaceData with salt into database

            #databaseFunctions.insertFaceAuthentication(encryptedData[0], last_used, userID, encryptedData[1])




        except Exception as e:
            return web.Response(text=f"Error processing image: {str(e)}", status=400)

    # Return error if no file was uploaded
    return web.Response(text="No file uploaded.", status=400)

async def encryptFaceData(facial_encoding_list, userID, userOAuthID):
    encryption = UserEncryption()

    #generate users salt if EACH TIME when encrypting data
    userSalt = encryption.generate_user_salt()

    #generate users encryption key
    userEncryptionKey = encryption.generate_key(userOAuthID, userSalt)

    #encrypt face data using hardcoded oauth2 ID
    encryptedFaceData = encryption.encrypt_list(facial_encoding_list, userOAuthID, userSalt)

    #this returns a tuple of the encryptedFaceData located at index 0 and
    #the encrypted salt located at index 1
    return encryptedFaceData


async def decryptedFaceData(encryptedFaceData, userID, userSalt, userOAuthID):
    encryption = UserEncryption()

    #generate users salt

    #time to decrypt it
    decryptedFaceData = encryption.decrypt_list(encryptedFaceData, userOAuthID, userSalt)

    return decryptedFaceData



if __name__ == "__main__":
    app = asyncio.run(init_app())
    web.run_app(app, host='0.0.0.0', port=4269)  # Change port as needed

