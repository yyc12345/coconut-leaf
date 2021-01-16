import json

CustomConfig = None

# read cfg
with open('config.cfg', 'r', encoding='utf-8') as f:
    CustomConfig = json.load(f)
