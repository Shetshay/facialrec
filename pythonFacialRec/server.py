import asyncio
import facialFunctions
import databaseFunctions
from aiohttp import web
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
    app.router.add_post('/cookie', testingCookie)
    return app

async def testingCookie(request):
    cookies = request.cookies

    my_cookie_value = cookies.get('session-name')

    if my_cookie_value:
        return web.json_response({'cookie_value': my_cookie_value})
    else:
        return web.json_response({'error': 'Cookie not found'}, status=404)



async def compareTwoFaces(request):
# Parse the incoming form data
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

            #NEED TO DO THIS
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

            print(facial_encoding_list)
            #print(type(facial_encoding_list))

            last_used = datetime.now()

            databaseFunctions.insertFaceAuthentication(facial_encoding_list, last_used, 1)

            output = facialFunctions.get_face_comparison_result(facial_encoding_list, facial_encoding_list)
            print(output)
            return web.json_response({"encoding": output})

        except Exception as e:
            return web.Response(text=f"Error processing image: {str(e)}", status=400)

    # Return error if no file was uploaded
    return web.Response(text="No file uploaded.", status=400)


if __name__ == "__main__":
    app = asyncio.run(init_app())
    web.run_app(app, host='0.0.0.0', port=5000)  # Change port as needed

