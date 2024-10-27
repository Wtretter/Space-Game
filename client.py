import requests
import argparse
import json
import sys
import random
import re
from models import *


class RequestError(Exception):
    pass


parser = argparse.ArgumentParser()
parser.add_argument("command")
parser.add_argument("-u", "--username", default="user1")
parser.add_argument("-p", "--password", default="password")
args = parser.parse_args()




if args.command == "register":
    response = requests.post("http://0.0.0.0:42000/register", json={"username": args.username, "password": args.password})
    if response.status_code == 200:
        print(response.json())
    else:
        print(response.content)
        sys.exit(1)

    response = requests.post("http://0.0.0.0:42000/login", json={"username": args.username, "password": args.password})

elif args.command == "login":
    response = requests.post("http://0.0.0.0:42000/login", json={"username": args.username, "password": args.password})

if response.status_code == 200:
    print(response.json()[0])
else:
    print(response.content)

login_token = response.json()[1]

def request(endpoint: str, data = {}):
    response = requests.post(f"http://0.0.0.0:42000{endpoint}", json={"token": login_token, **data})
    if response.status_code != 200:
        raise RequestError(response.text)
    return response.json()




try:
    ship = Ship.model_validate(request("/ship/get"))
except RequestError:
    ship_name = input("please name your vessel\n")
    ship = Ship.model_validate(request("/ship/create", {"ship_name": ship_name}))

def printship(ship):
    print("The ship ", ship.name, " is currently in sector ", ship.coords)
    print("Hull Strength: ", ship.hitpoints)
    print("Cargo: ", ship.cargo_used, "/", ship.cargo_space)
    print("Cash On Hand: ", ship.money)


def combat_loop(ship: Ship):
    print("rounds in combat: ", ship.time_in_combat)
    attackers = [PirateShip.model_validate(ship) for ship in request("/piracy/get")]
    for attacker in attackers:
        print("enemy health: ", attacker.hitpoints)

    if ship.time_in_combat == 0:
        print("a pirate has appeared!")
        choice = input(f"the pirate {attacker.name} wants {(attacker.bribe * 100)}% of your cargo and money to let you live\nOPTIONS:\nPAY\nSHOOT\nRUN\n").lower()
    else:
        print("you are in combat!")
        choice = input("SHOOT or RUN?\n").lower()

    if choice == "pay":
        request("/piracy/bribe", {"bribe": attacker.bribe})
        print("the pirate thanks you for your cooperation and jumps away\n")

    elif choice == "/admin/reset":
        request("/reset")

    elif choice == "/nopirates":
        request("/admin/nopirates")

    elif choice == "run":
        if (ship.time_in_combat * ship.jump_cooldown_amount) >= ship.cargo_used:
            request("/piracy/run")
        else:
            request("/piracy/dodge")

    elif choice == "shoot":
        request("/piracy/fight")

    else:
        print("unrecognized command\n")


def non_combat_loop(ship: Ship):
    choice = input("\nwhat would you like to do?\n").lower()

    if choice == "/reset":
        request("/admin/reset")

    elif choice == "/nopirates":
        request("/admin/nopirates")

    elif choice == "/yespirates":
        request("/admin/yespirates")

    elif choice == "exit":
        sys.exit()

    elif choice == "help":
        print("The currently available options are:\nSTATUS\nMOVE (axis \"X|Y|Z\" and direction \"UP|DOWN\")\nBUY\nSELL\nUPGRADE\nHELP\nEXIT")

    elif choice == "status":
        pass

    elif choice == "buy":
        if ship.cargo_used >= ship.cargo_space:
            print("\nYou are out of cargo space!")
        elif ship.money <= 0:
            print("no money!")
        else:
            request("/cargo/buy")

    elif choice == "sell":
        if ship.cargo_used <= 0:
            print("no cargo to sell!")
        else:
            request("/cargo/sell")

    elif choice == "upgrade":
        if ship.money >= 1:
            upgrade = input("please choose an upgrade: HULL or CARGO\n").lower()
            if upgrade == "cargo":
                request("/upgrade/cargo")
            elif upgrade == "hull":
                request("/upgrade/hull")
            else:
                print("unrecognized choice, returning to menu")
                return
        else:
            print("no money!")

    elif choice == "move":
        axis = input("please pick an axis to move on (x, y, or z)\n").lower()
        if axis == "x" or axis == "y" or axis == "z":
            direction = input("up or down?\n").lower()
            if direction == "up" or direction == "down":
                request(f"/move/{axis}/{direction}")
            else:
                print("unrecognized choice, returning to menu")
                return
        else:
            print("unrecognized choice, returning to menu")
            return

    elif re.fullmatch(r"move (x|y|z) (up|down)", choice):
        request(f"/move/{choice[5]}/{choice[7:]}")

    else:
        print("not a valid option, type \"help\" for help")


print("\nWelcome to space-game, here are your current stats:")
while True:
    ship = Ship.model_validate(request("/ship/get"))
    printship(ship)
    if ship.in_combat:
        combat_loop(ship)
    else:
        non_combat_loop(ship)
