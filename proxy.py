from config import config
import requests, json, datetime, time
from flask import Flask, request, Response

app = Flask(__name__)

@app.route('/')
def proxy():
    return 'Hello human, I am just a simple proxy; I come in peace!'

@app.route('/groups', methods = ['GET'])
def groups():

    data = requests.get('https://api.groupme.com/v3/groups?token=' + config['token'])
    js = json.dumps(data.json())
    resp = Response(js, status=200, mimetype='application/json')
    resp.headers['Access-Control-Allow-Origin'] = "*"
    return resp


@app.route('/groups/<groupid>/sift', methods = ['GET'])
def sift(groupid):

    data_users = requests.get('https://api.groupme.com/v3/groups/' + groupid + '?token=' + config['token'])
    data_users = data_users.json()
    data_users = data_users['response']['members']

    list_of_users = []
    for user in data_users:
        list_of_users.append(user['user_id'])

    toRet = {}

    week = {
        '0': 0,
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0,
        '6': 0
    }

    likes_map = {}
    user_stats = {}

    for user in list_of_users:
        user_stats[user] = {}
        user_stats[user]['total_messages'] = 0
        user_stats[user]['total_words'] = 0
        user_stats[user]['total_likes'] = 0
        user_stats[user]['conversations'] = 0

        likes_map[user] = {}
        for userAgain in list_of_users:
            likes_map[user][userAgain] = 0

    kill_sift = 0
    message_to_continue_from = -1
    while ( kill_sift == 0 and (message_to_continue_from == - 1 or len(messages) == 100) ):
        if (message_to_continue_from == -1 ):
            sift_data = requests.get('https://api.groupme.com/v3/groups/' + groupid + '/messages?limit=100&token=ef05192072b40133937349967f5e706e')
        else:
            sift_data = requests.get('https://api.groupme.com/v3/groups/' + groupid + '/messages?limit=100&before_id=' + message_to_continue_from + '&token=ef05192072b40133937349967f5e706e')
        
        sift_data = sift_data.json()
        messages = sift_data['response']['messages']

        conversation = {'stage': 0, 'user': 0, 'start_time': 0, 'next_time': 0}

        #iterate through each message
        for message in messages:
            user = message['user_id']
            if user not in list_of_users:
                continue
            user_stats[user]['total_messages'] += 1
            text = message['text']
            if text is not None:
                user_stats[user]['total_words'] += len( text.split(' ') )

            ### conversation detection #######
            cur_time = message['created_at']

            if conversation['stage'] == 0:
                if conversation['next_time'] == 0 or conversation['next_time'] - cur_time >= 7200:
                    conversation['stage'] += 1
                    conversation['user'] = user
                    conversation['start_time'] = cur_time
            elif conversation['stage'] >= 1 and conversation['stage'] <= 3:
                if conversation['start_time'] - cur_time  < 1800:
                    conversation['stage'] += 1
                else:
                    conversation['stage'] = 0
            elif conversation['stage'] == 4:
                user_stats[conversation['user']]['conversations'] += 1
                conversation['stage'] = 0

            ### likes breakdown ##############
            likers = message['favorited_by']
            for liker in likers:
                user_stats[user]['total_likes'] += 1
                if liker not in list_of_users:
                    continue
                likes_map[ liker ][ user ] += 1

            ### weekday breakdown ############
            date = datetime.datetime.fromtimestamp( message['created_at'] )
            week[str(date.weekday())] += 1

            conversation['next_time'] = cur_time

        message_to_continue_from = messages[len(messages) - 1]['id']

        # Limit the sift to a certain time period
        # if (int(time.time()) - message['created_at'] > 262974600):
        #   kill_sift = 1
        #   break

    toRet['week'] = week
    toRet['likes_map'] = likes_map
    toRet['user_stats'] = user_stats

    data_send = json.dumps(toRet)
    resp = Response(data_send, status=200, mimetype='application/json')
    resp.headers['Access-Control-Allow-Origin'] = "*"

    return resp


if __name__ == '__main__':
    app.debug = True
    app.run()

# resp.headers['Access-Control-Allow-Headers'] = "origin, x-requested-with, content-type"
# resp.headers['Access-Control-Allow-Methods'] = "PUT, GET, POST, DELETE, OPTIONS"
    