# scoutapp
ScoutApp sifts through your GroupMe data to provide interesting charts displaying group member activity/interactivity. 

## How to run
*Note: I've marked out any real names in the screenshots below because I don't want you creeping on my friends.*

* Download the project files, 
* Log into your GroupMe account on dev.groupme.com
* Create a new application under the *Applications* tab
* Set the Callback URL to *http://127.0.0.1:8000*
* Create a file *config.py* with the following contents:
```
config = {
    'token': 'insertyourgroupmeaccesstokenhere',
}
```
* Make sure to replace inside of the '' with the access token found on your GroupMe dev account
* Your new application should have been assigned a Redirect URL within your Groupme dev account; Replace the redirect URL I have in *index.html* with this new URL
* Open up 2 new Terminal sessions; in both, navigate to the project directory
* in the first session, run `python proxy.py`
* in the second session, run `python -m SimpleHTTPServer`
* the second session should respond with `Serving HTTP on 0.0.0.0 port 8000 ...`; if the port is different than 8000, you will have to go back to adjust the Callback URL set above,
* in your web browser, navigate to `http://127.0.0.1:8000` (or whatever port has been assigned to you)


After logging in through GroupMe OAuth, select one of your group chats from the list

![alt tag](http://i.imgur.com/PSajN4V.png)

/////////////////////////////////////////////

You'll then be shown a variety of interesting charts! The first and most exciting chart displays the total number of likes each group member has received, broken down (in colored partitions) by who has given them those likes. The key/legend below shows which group member matches each of the colored partitions.

![alt tag](http://i.imgur.com/NfzYC8r.png)

/////////////////////////////////////////////

There are a total of 6 charts being generated; here are some more examples:

![alt tag](http://i.imgur.com/p0qEYUn.png)

