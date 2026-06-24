#!/usr/bin/env python3

import os
import re
import json
import argparse

def main():
    parser = argparse.ArgumentParser(description="Extract cluster template names from folder.")
    parser.add_argument("folder", help="Path to the folder containing .yaml files")
    args = parser.parse_args()

    result = {}
    pattern = re.compile(r"^([a-z0-9-]+)-\d+-\d+-\d+\.yaml$")

    for filename in os.listdir(args.folder):
        match = pattern.match(filename)
        if match:
            name_without_ext = filename[:-5]  # remove ".yaml"
            key = match.group(1).replace("-", "_")
            result[key] = name_without_ext
    print(json.dumps(result, sort_keys=True))

if __name__ == "__main__":
    main()
