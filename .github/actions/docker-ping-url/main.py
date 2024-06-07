import os
import requests
from time import sleep

def ping_url(website_url, delay, max_trials):
    trials = 0
    while trials < max_trials:
        try:
            response = requests.get(website_url)
            if response.status_code == 200:
                print(f"Successfully pinged {website_url}")
                return True
        except requests.ConnectionError:
            print(f"Failed to ping {website_url}. Retrying in {delay} seconds...")
            sleep(delay)
            trials += 1
        except requests.exceptions.MissingSchema:
            print(f"Invalid URL: {website_url}")
            return False
    return False

def run():
    print("Hello, World!")
    website_url = os.getenv("INPUT_URL")
    delay = int(os.getenv("INPUT_DELAY"))
    max_trials = int(os.getenv("INPUT_MAX_TRIALS"))

    website_reachable = ping_url(website_url, delay, max_trials)

    if not website_reachable:
        raise Exception(f"Failed to ping {website_url} after {max_trials} trials")

    print(f"Successfully pinged the website! {website_url}")

if __name__ == "__main__":
    run()