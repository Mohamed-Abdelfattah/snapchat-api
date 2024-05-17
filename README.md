app flow after getting the access token

- any agent/browser will hit the url of the website
- for any request to the flask server a check for the access token should run and run a refresh expiry and run a function to refresh token and save it into environmental variable if needed
- flask server will then send the html of index page
- the frontend will responsible for sending requests to the flask endpoints that will connect to the snapchat api
-
