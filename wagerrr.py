import requests
import json


response = requests.get("https://explorer.wagerr.com/api/bet/events?eventId=")

def jprint(obj):
    # create a formatted string of the Python JSON object
    text = json.dumps(obj, sort_keys=True, indent=4)
    print(text)

# print(jprint(response.json()))

events = []
for k, a in enumerate(response.json()['events']):
	if "status" not in a:
		events.append(a['eventId'])
	


print( len(events) )

# total = 0

# for ev in events:
# 	response_bet = requests.get("https://explorer.wagerr.com/api/bet/actions?eventId="+ ev)
# 	for a in response_bet.json()['actions']:
# 		if a['completed'] == False:
# 			# print('It is False')
# 			# print('<br>')
# 			# print(f"Bet WGR: {a['betValue']}")
# 			total += (a['betValue'])

# print(f'Total bet = {int(total)}')

