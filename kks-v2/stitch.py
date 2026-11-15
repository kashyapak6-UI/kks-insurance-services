import json,glob,os
from PIL import Image
for name in ["desktop","mobile"]:
    d=json.load(open(f"screenshots/.tiles-{name}.json")); sc=d["scale"]
    tiles=d["tiles"]; H=sum(h for _,h in tiles)*sc
    out=Image.new("RGB",(d["w"]*sc,H)); y=0
    for f,h in tiles:
        im=Image.open(f); hh=h*sc
        out.paste(im.crop((0,im.height-hh,im.width,im.height)),(0,y)); y+=hh
    if name=="mobile": out=out.resize((out.width//2,out.height//2))
    out.save(f"screenshots/{name}-full.png"); print(name,out.size)
for f in glob.glob("screenshots/.tile*"): os.remove(f)
