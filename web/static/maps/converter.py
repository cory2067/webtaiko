import csv
import json

NAME = "test"

out = {
        "title": NAME,
         "approachTime": 1000,
         "hits": []
      }

with open(NAME + ".osu") as f:
    reader = csv.reader(f)
    for row in reader:
        time = int(row[2])
        hitsound = int(row[4])
        osu_type = int(row[3])
        duration = -1

        tk_type = 0 # normal
        if (hitsound & 2) or (hitsound & 8):
            tk_type = 1 # clap or whistle
        if hitsound & 4:
            tk_type += 2 # finish (large circle)
        if osu_type & 2:
            tk_type += 4 # slider
            duration = 1000
        elif osu_type & 8:
            tk_type += 8 # spinner
            duration = 1000

        if duration == -1:
            out['hits'].append([time, tk_type])
        else: # for sliders/spinners
            out['hits'].append([time, tk_type, duration])

with open(NAME + ".tk", "w") as f:
    f.write(json.dumps(out))
