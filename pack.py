import os
import requests
import zipfile
import json
import itertools

os.makedirs("RELEASE", exist_ok=True)

with open("manifest.json", "r") as fptr:
    version = json.load(fptr)["version"]

zipf_release = zipfile.ZipFile(f"RELEASE\\NRMTv{version}.zip", "w", zipfile.ZIP_DEFLATED)
zipf_source = zipfile.ZipFile(f"RELEASE\\NRMTv{version}_source.zip", "w", zipfile.ZIP_DEFLATED)

for ziph, f in itertools.product((zipf_release, zipf_source), ("manifest.json", "README.md")):
    ziph.write(f)

zipf_source.write("main.js")

with open("main.js", "r") as fptr:
    data = {"input": fptr.read()}

response = requests.post("https://javascript-minifier.com/raw", data=data)

zipf_release.writestr("main.js", response.content)