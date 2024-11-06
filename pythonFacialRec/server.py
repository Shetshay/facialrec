import asyncio
import facialFunctions
import databaseFunctions
import aiohttp
from aiohttp import web, ClientSession
from PIL import Image
import io
import json
from datetime import datetime

async def hello(request):
    return web.Response(text="Hello, World!")

async def init_app():
    app = web.Application()
    app.router.add_get('/', hello)
    app.router.add_post('/faceData', firstFaceScan)
    app.router.add_post('/compareTwoFaces', compareTwoFaces)
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
            async with session.get("http://backend:3000/api/userCookieInfo", headers=headers) as response:
                response.raise_for_status()
                data = await response.json()
                return data
        except Exception as e:
            # Log or handle error if the request fails
            print(f"Failed to fetch data: {response.status}")
            return None

async def compareTwoFaces(request):
    # Parse the incoming form data

    #get the cookie info

    cookie_value = request.headers.get("Cookie")  # Extract cookie from incoming request

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

            facial_encoding_list = facial_encoding.tolist()

            #get info of facialData from database (hardcoded for now)
            databaseFacialData = databaseFunctions.getUserFacialData(1)

            #change it into a list to pass into facial rec python functions
            #which take a list. It will convert it to numpy array

            databaseFacialDataList = list(databaseFacialData[0])

            #NEED TO DO THIS TO PROCESS CORRECTLY
            oldFaceData = databaseFacialDataList[0]

            output = facialFunctions.get_face_comparison_result(facial_encoding_list, oldFaceData)

            print(output)


            return web.json_response({"encoding": output})

        except Exception as e:
            return web.Response(text=f"Error processing image: {str(e)}", status=400)

    # Return error if no file was uploaded
    return web.Response(text="No file uploaded.", status=400)




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

            print(user_info)

            #check to see if face data already in if so skip
            if not databaseFunctions.checkIfUserHasFacialData(userID):
                print("THEY DONT GOT FACE")
                databaseFunctions.insertFaceAuthentication(facial_encoding_list, last_used, userID)
                return web.json_response({
                    "message": "New user successfully created",
                    "redirect_url": "http://localhost:8000/files"
                })
            else:
                print("THEY GOT FACE ALREADY")
                faceRecResults = await compareTwoFaces(userID, facial_encoding_list)
                if faceRecResults == True:
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

async def compareTwoFaces(userID, facial_encoding_list):
    # Parse the incoming form data
    try:
        #dont need to do this since we pass in facial_encoding_list from this function
        #facial_encoding = facialFunctions.get_face_encoding(output_buffer)

        #facial_encoding_list = facial_encoding.tolist()

        #get info of facialData from database (hardcoded for now)
        databaseFacialData = databaseFunctions.getUserFacialData(userID)

        #change it into a list to pass into facial rec python functions
        #which take a list that will convert it to numpy array

        databaseFacialDataList = list(databaseFacialData[0])

        #NEED TO DO THIS TO PROCESS CORRECTLY
        oldFaceData = databaseFacialDataList[0]

        output = facialFunctions.get_face_comparison_result(facial_encoding_list, oldFaceData)

        print(output)

        return output

    except Exception as e:
        return print(e)



if __name__ == "__main__":
    app = asyncio.run(init_app())
    web.run_app(app, host='0.0.0.0', port=5000)  # Change port as needed

