import csv
import json

NAME = "jbf"

out = {
        "title": NAME,
         "tracks": [
            {"color": "red", "sound": "center", "row": 2},
            {"color": "blue", "sound": "rim", "row": 1},
            {"color": "yellow", "sound": "ride", "row": 0}
         ], 
         "approachTime": 1000,
         "hits": []
      }

with open(NAME + ".osu") as f:
    reader = csv.reader(f)
    for row in reader:
        hitsound = int(row[4])
        track = 0 # red
        if (hitsound & 2) or (hitsound & 8):
            track = 1 # clap or whistle
        if (hitsound & 4):
            track = 2 # finish
        out['hits'].append([int(row[2]), track])

with open(NAME + ".tkm", "w") as f:
    f.write(json.dumps(out))
