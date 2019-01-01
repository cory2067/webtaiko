import csv
import json

NAME = "augo"

out = {
        "title": NAME,
         "approachTime": 1000,
         "hits": []
      }

with open(NAME + ".osu") as f:
    reader = csv.reader(f)
    for row in reader:
        hitsound = int(row[4])
        track = 0 # normal
        if (hitsound & 2) or (hitsound & 8):
            track = 1 # clap or whistle
        if (hitsound & 4):
            track += 2 # finish
        out['hits'].append([int(row[2]), track])

with open(NAME + ".tk", "w") as f:
    f.write(json.dumps(out))
