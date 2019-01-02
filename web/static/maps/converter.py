import csv
import json

NAME = input("name: ")

out = {
        "title": NAME,
         "approachTime": 1000,
         "hits": []
      }

with open(NAME + ".osu") as f:
    osu = f.read()
    meta,hits = osu.split("[HitObjects]")

slider_mult = float(meta.split("SliderMultiplier:")[1].split("\n")[0])

# this is grimy dude
timing = list(csv.reader(meta.split("[TimingPoints]")[1].split("[")[0].strip().split("\n")))

# get ms per beat
def get_timing(ms):
    r = 0
    while int(timing[r+1][0]) < ms:
        r += 1
        if r == len(timing) - 1:
            break

    per_beat = float(timing[r][1])
    while float(timing[r][1]) < 0:
        r -= 1

    if per_beat < 0:
        return -per_beat*0.01 * float(timing[r][1])
    return per_beat


if True:
    reader = csv.reader(hits.strip().split("\n"))
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
            pixel_length = int(row[6]) * int(row[7])
            duration = pixel_length / (100 * slider_mult) * get_timing(time)
        elif osu_type & 8:
            tk_type += 8 # spinner
            duration = int(row[5]) - time

        if duration == -1:
            out['hits'].append([time, tk_type])
        else: # for sliders/spinners
            out['hits'].append([time, tk_type, int(0.5 + duration)])

with open(NAME + ".tk", "w") as f:
    f.write(json.dumps(out))
