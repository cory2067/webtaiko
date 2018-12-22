import csv
import json

out = {
        "title": "kero",
         "tracks": [
            {"color": "red", "sound": "center", "row": 2},
            {"color": "blue", "sound": "rim", "row": 1}
         ], 
         "approachTime": 1000,
         "hits": []
      }

with open("kero.osu") as f:
    reader = csv.reader(f)
    for row in reader:
        hitsound = int(row[4])
        color = 0 # red
        if (hitsound & 2) or (hitsound & 8) :
            color = 1 # clap or whistle
        out['hits'].append([int(row[2]), color])

with open("kero.tkm", "w") as f:
    f.write(json.dumps(out))
