import os
import re
import hashlib
import requests  # Import requests library for POST requests
from flask import Flask, redirect, url_for, make_response, request, render_template, jsonify
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


@app.route("/random-users", methods=["POST"])
def random_users():
    number_of_users, input_error = validate_int(
        request.form.get("random-users-number", 50))
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
        random_list_name = get_new_list_name()
    # return the list of users and the random list name as JSON
    return make_response(jsonify({"users":users_list, "newListName":random_list_name}), 200)


def validate_int(value):
    try:
        if value == '' or value == 0:
            return 50, None
        return int(value), None
    except:
        return None, "Invalid input. not a valid integer."


def get_new_list_name():
    """
    Get a new list name by checking the existing list names and generating a new name.

    Returns:
        str: The new list name.
    """
    # check the already existing list names
    existing_lists = get_directories_names('segments')
    pattern = r'New List (\d+)'
    # Extract numbers from directory names that match the 'New List X' format
    numbers = []
    for list_name in existing_lists:
        match = re.match(pattern, list_name)
        if match:
            numbers.append(int(match.group(1)))
    # sort the numbers
    numbers.sort()
    next_number = max(numbers,default=0) + 1
    for i, value in enumerate(numbers,1):
        if i != value:
            next_number = i
            break
    new_list_name = f"New List {next_number}"
    return new_list_name


def get_directories_names(directory_name):
    # get all list names from "segments" folder
    directory_path = os.path.join(app.root_path, directory_name)
    if os.path.exists(directory_path) and os.path.isdir(directory_path):
        # List only the directories within the specified directory
        directories = [d for d in os.listdir(directory_path) if os.path.isdir(os.path.join(directory_path, d))]
        print("\n@get_directories_names ---- directories: " + str(directories)+"\n")
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


print("------- faker -------")
print(fake.city())

# print("------- will create emails file -------")
# create_emails_file()

if __name__ == "__main__":
    app.run(debug=True)
