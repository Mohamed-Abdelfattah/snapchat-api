import os
import requests  # Import requests library for POST requests
import hashlib
from flask import Flask, redirect, url_for, make_response,request,render_template,jsonify
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
    login_url = f"https://accounts.snapchat.com/login/oauth2/authorize?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code&scope=snapchat-marketing-api"
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
        return f"Access Token: {access_token}<br>Refresh Token: {refresh_token}"  # Example output
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
            with open ("segments/processed_" + file.filename, "a") as f2:
                for line in f:
                    token = hashlib.sha256(line.strip().lower().encode('utf-8')).hexdigest()
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

    processing_result= process_file(file)
    if processing_result["processed"] == False:
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
    number_of_users,input_error = validate_int(request.form.get("random-users-number",50))
    if input_error:
        return make_response(input_error, 400)
    users = []
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
        users.append(user)
    # return the list of users as JSON
    return make_response(jsonify(users), 200)


def validate_int(input):
    try:
        if input == '' or input == 0:
            return 50,None
        return int(input),None
    except:
        return None,"Invalid input. not a valid integer." 


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


