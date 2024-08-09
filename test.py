def extract_segment_info(directory_name):
    parts = directory_name.split("+++")
    if len(parts) == 2 and parts[1].strip():
        # The string follows the format and has a non-empty ID
        return parts[0].strip(), parts[1].strip()
    else:
        # The string doesn't follow the format or has an empty ID
        return directory_name, "no_id"


# Test cases
test = ["lol", "lol +++ 798", "lol +++", "lol +++ ", "lol ++ 89", "lol ++ ", "lol ++ "]

for item in test:
    name, id = extract_segment_info(item)
    print(f"Original: '{item}', Name: '{name}', ID: {id}")
