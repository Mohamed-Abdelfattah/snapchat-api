import os
import re
import hashlib
import random
import time
import requests  # Import requests library for POST requests
from flask import Flask, redirect, url_for, make_response, request,Response, render_template, jsonify
from dotenv import load_dotenv
from faker import Faker

load_dotenv()
fake = Faker("en_US")

app = Flask(__name__)


# route for the main page to simple welcome page
@app.route("/")
def index():
    return render_template('index.html')


@app.route("/generate")
def generate():
    CLIENT_ID = os.getenv('CLIENT_ID')
    REDIRECT_URI = os.getenv('REDIRECT_URI')
    # Login URL with client ID, redirect URI, and scope
    login_url = f"https://accounts.snapchat.com/login/oauth2/authorize?client_id={
        CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code&scope=snapchat-marketing-api"
    return redirect(login_url)


@app.route("/callback")
def callback():
    # Extract authorization code from query string
    code = request.args.get("code")
    print(f"Code: {code}")
    CLIENT_SECRET = os.getenv('CLIENT_SECRET')
    CLIENT_ID = os.getenv('CLIENT_ID')
    REDIRECT_URI = os.getenv('REDIRECT_URI')
    ACCESS_TOKEN_URL = os.getenv('ACCESS_TOKEN_URL')
    # Exchange code for access token (POST request with requests library)
    data = {
        "grant_type": "authorization_code",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI,
        "code": code,
    }
    response = requests.post(ACCESS_TOKEN_URL, data=data)

    # Handle response (check for errors, extract tokens if successful)
    if response.status_code == 200:
        access_token = response.json()["access_token"]
        refresh_token = response.json()["refresh_token"]
        print(f"Access Token: {access_token}\nRefresh Token: {refresh_token}")
        # Example output
        return f"Access Token: {access_token}<br>Refresh Token: {refresh_token}"
    else:
        error_message = response.json().get("error_description")
        print(f"Error: {error_message}")
        return f"Error: {error_message}"


def print_emails_file():
    with open("Audience_Match_Email_Example.csv", "r") as f:
        text = []
        count = 0
        # for line in f:
        # text += line
        # text.append(hashlib.sha256(line.strip().lower().encode('utf-8')).hexdigest())

    # with open("Untitled spreadsheet - Audience_Match_Email_Example.csv", "r") as f:
        # text = f.read().split()
        # print(len(text))
        print("done --- text length: " + str(len(text)))


def process_file(file):
    try:
        with open(file.filename, "r") as f:
            with open("segments/processed_" + file.filename, "a") as f2:
                for line in f:
                    token = hashlib.sha256(
                        line.strip().lower().encode('utf-8')).hexdigest()
                    f2.write(token + "\n")
    except Exception as e:
        print("@process file --- error: " + str(e))
        return {"processed": False, "error": str(e)}

    print("@process file ---- file was processed successfully")
    return {"processed": True, "error": None, "filePath": "segments/processed_" + file.filename}




@app.route("/upload", methods=["POST"])
def upload():
    if 'file' not in request.files:
        return make_response("No file uploaded", 400)

    file = request.files['file']
    if file.filename == "":
        return make_response("No file selected", 400)

    processing_result = process_file(file)
    if processing_result["processed"] is False:
        return make_response(f"An error occurred while processing the file: {processing_result["error"]}", 500)

    access_token = os.getenv("ACCESS_TOKEN")

    # Send the file to Snapchat API
    snapchat_url = 'https://adsapi.snapchat.com/v1/segments/5608799417859305/users'
    headers = {
        'Authorization': f'Bearer {access_token}',
        # Add any other required headers by the API
    }
    with open(processing_result["filePath"], 'rb') as f:
        files = {'file': f}
        response = requests.post(snapchat_url, headers=headers, files=files)

    print("@upload --- response: " + str(response))
    # Check the response and act accordingly
    if response.status_code == 200:
        return "File sent to Snapchat successfully"
    else:
        return "Error sending file to Snapchat"


@app.route("/generate-random-list", methods=["POST"])
def generate_random_list():
    number_of_users, input_error = validate_int(
        request.form.get("random-users-number", 50))
    print("@generate_random_list --- number_of_users: " + str(number_of_users))
    if input_error or number_of_users == None:
        return make_response(input_error, 400)
    users_list = []
    for i in range(number_of_users):
        user = {
            "email": fake.email(),
            "phone_number": fake.phone_number(),
            "name": fake.name(),
            "city": fake.city(),
            "age": fake.pyint(min_value=18, max_value=80),
            "notes": fake.text(60),
            "id": i+1,
        }
        users_list.append(user)
    random_segment_name = get_new_segment_name()
    # random_segment_name = "New Segment"
    # return the list of users and the random segment name as JSON
    return make_response(jsonify({"users":users_list, "newSegmentName":random_segment_name}), 200)


@app.route("/segments", methods=["GET"])
def get_segments():
    directories = get_directories_names('segments')
    segments = []
    for directory in directories:
        segment_name, segment_id = extract_segment_info(directory)
        segments.append({"segmentName":segment_name, "segmentId":segment_id})
    return make_response(jsonify(segments), 200)


@app.route('/segments/<segment_id>', methods=['GET'])
def get_segment(segment_id):
    segment_name = request.args.get('name')
    segment_directory = compose_segment_directory_name(segment_name, segment_id)
    # open the data.json file within the segment directory and send back the data and handle possible errors
    return make_response(jsonify(segment_directory), 200)



@app.route("/segments", methods=["POST"])
def create_new_segment():
    data = request.get_json()
    if not data :
        return jsonify({"error": "No data provided"}), 400
    # Simulate immediate response by sending SSE
    def generate():
        print(f"Processing data: {[item for item in data]}")  # Placeholder for processing logic
        try:
            yield "data:Processing started\n\n"  # Send initial status
            time.sleep(2)  # Simulate processing delay
            yield "data: phase 1\n\n"  # Send initial status
            time.sleep(2)  # Simulate processing delay
            yield "data: hang on there\n\n"  # Send initial status
            if True:
                raise Exception("error while processing data at phase 2" )
            time.sleep(2)  # Simulate processing delay
            # Put your actual processing logic here
            time.sleep(2)  # Simulate processing time
            yield "data: Processing completed\n\n"  # Send completion status
        except Exception as e:
            yield f"error: {str(e)}\n\n"

    return Response(generate(), mimetype='text/event-stream')


def extract_segment_info(directory_name):
    parts = directory_name.split("+++")
    if len(parts) == 2 and parts[1].strip():
        return parts[0].strip(), parts[1].strip()
    else:
        return directory_name, "no_id"


def compose_segment_directory_name(name, segment_id=None):
    """
    Compose a directory name for a segment using the name and ID.
    
    Args:
    name (str): The name of the segment.
    segment_id (str, optional): The ID of the segment. Defaults to None.
    
    Returns:
    str: The composed directory name.
    """
    if segment_id is None:
        return f"{name} +++ placeholder_for_segment_id"
    if segment_id == "no_id":
        return name
    return f"{name} +++ {segment_id}"


def validate_int(value):
    try:
        if value == '' or value == 0:
            return 50, None
        return int(value), None
    except:
        return None, "Invalid input. not a valid integer."


def get_new_segment_name():
    """
    Get a temporary new segment name by checking the existing segment names and generating a new name.
    
    Returns:
        str: The new segment name.
    """
    # check the already existing segment names
    existing_segments = get_directories_names('segments')
    pattern = r'New Segment (\d+)'
    # Extract numbers from directory names that match the 'New Segment X' format
    unique_numbers = set()
    for segment_name in existing_segments:
        match = re.match(pattern, segment_name,re.IGNORECASE)
        if match:
            # print("@get_new_segment_name ---- match.group(1): " + str(match.group(1)))
            unique_numbers.add(int(match.group(1)))
    # Convert the set back to a segment and sort the numbers
    numbers = sorted(list(unique_numbers))
    next_number = max(numbers,default=0) + 1
    for i, value in enumerate(numbers,1):
        if i != value:
            next_number = i
            break
    new_segment_name = f"New Segment {next_number} +++ placeholder-for-segment-id-{random.randint(10**18, 10**19)}"
    return new_segment_name


def get_directories_names(directory_name):
    """
    Get all the directory names from a specified directory.
    Args:
        directory_name (str): The name of the directory to get the names from.
    Returns:
        list: A list of directory names within the specified directory. If the directory does not exist or is not a directory, an empty list is returned.
    """
    # get all list names from "segments" folder
    directory_path = os.path.join(app.root_path, directory_name)
    print("@get_directories_names ---- directory_path: " + str(directory_path))
    if os.path.exists(directory_path) and os.path.isdir(directory_path):
        print("@get_directories_names ---- directory_path exists ---- if condition passed " )
        # List only the directories within the specified directory
        directories = [d for d in os.listdir(directory_path) if os.path.isdir(os.path.join(directory_path, d))]
        print("@get_directories_names ---- directories: " + str(directories)+"\n")
        return directories
    return []


def create_emails_file():
    # text = []
    with open("100000_mails.txt", "a") as f:
        # loop 100000 to create emails file
        for n in range(100000):
            f.write("test" + str(n+1) + "@test.com\n")
            # f.write(hashlib.sha256("test" + str(n+1) + "@test.com".strip().lower().encode('utf-8')).hexdigest() + "\n")
    with open("100000_mails.txt", "r") as f:
        text = f.read().split()
    print("@create emails file ---- done --- text length: " + str(len(text)))


# print("------- faker -------")
# print(fake.city())

# print("------- will create emails file -------")
# create_emails_file()

if __name__ == "__main__":
    app.run(debug=True)
