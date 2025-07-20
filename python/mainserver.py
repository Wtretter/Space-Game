from database import users, ships, goods
from enum import Enum
from fastapi import FastAPI, Request, WebSocket
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from pydantic.functional_validators import AfterValidator
from pydantic import ValidationError, model_validator
from typing_extensions import Annotated
from models import *
import pymongo.errors
import uvicorn
import security
import json
import random
import utils

class LoginRequest(BaseModel):
    username: str
    password: str

class RegistrationRequest(BaseModel):
    username: str
    password: str

class AuthError(Exception):
    pass

class ClientError(Exception):
    pass

class Axis(str, Enum):
    x = "x"
    y = "y"
    z = "z"

class Direction(str, Enum):
    up = "up"
    down = "down"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AuthObject(BaseModel):
    username: str
    timestamp: datetime = Field(default_factory=datetime.now)
    signature: str = ""

    @classmethod
    def create(cls, username: str):
        auth = AuthObject(username=username)
        auth.signature = security.sign(auth.serialize())
        return auth

    def serialize(self) -> str:
        return json.dumps(self.model_dump(mode="json", exclude=["signature"]))

    def verify(self):
        time_diff = datetime.now() - self.timestamp
        if not security.validate(self.serialize(), self.signature):
            raise AuthError("could not validate token, please log in again")
        if time_diff > timedelta(weeks=1):
            raise AuthError("token expired, please log in again")
        return self


class GameRequest(BaseModel):
    token: Annotated[AuthObject, AfterValidator(lambda token: token.verify())]


class ShipRequest(GameRequest):
    ship: Ship = None

    def on_validate(self):
        pass

    @model_validator(mode="wrap")
    def combat_validator(self, handler):
        request: ShipRequest = handler(self)
        request.ship = get_ship(request.token.username)
        request.on_validate()
        return request

class CombatRequest(ShipRequest):
    def on_validate(self):
        if not self.ship.in_combat:
            raise ClientError("You are not in combat")

class NonCombatRequest(ShipRequest):
    def on_validate(self):
        if self.ship.in_combat:
            raise ClientError("You are in combat")
        
class ItemRequest(NonCombatRequest):
    item_id:str

class NoteRequest(ShipRequest):
    title: str
    contents: str
    coords: Position

class NoteRemoveRequest(ShipRequest):
    coords: Position

class BuyRequest(NonCombatRequest):
    name: str

class CreateShipRequest(GameRequest):
    ship_name: str

class PiracyBribeRequest(ShipRequest):
    bribe: int

class PiracyDodgeRequest(ShipRequest):
    attacker_firepower: int

class PiracyFightRequest(ShipRequest):
    attacker_firepower: int
    self_firepower: int


def get_ship(data: str) -> Ship:
    return Ship.model_validate(ships.find_one({"$or": [{"owner": data}, {"id": data}]}))

def get_pirate(data: str) -> PirateShip:
    return PirateShip.model_validate(ships.find_one({"id": data}))

def piracy_check(ship: Ship) -> bool:
    if ship.no_pirates:
        return False
    else:
        # return True
        return random.randint(0,1) and (
            (
                ship.cargo_used
                + abs(ship.coords["x"])
                + abs(ship.coords["y"])
                + abs(ship.coords["z"])
                + ship.money
                - (ship.hitpoints - 100)
            ) >= random.randint(1,10000)
        )
    
def load_item(item_name: str) -> InventoryItem:
    item = InventoryItem.model_validate(goods.find_one({"name": item_name}))
    item.id = generate_id()
    return item

def generate_low_level_pirate() -> PirateShip:
    pirate_hp = random.randint(20, 30)
    attacker = PirateShip(hitpoints=pirate_hp, max_hitpoints=pirate_hp, bravery=random.randint(5,30), bribe=.05)
    attacker.installed_items.append(load_item("Mining Laser"))
    return attacker

def generate_mid_level_pirate() -> PirateShip:
    attacker = PirateShip(hitpoints=250, max_hitpoints=250, bravery=random.randint(25,500), bribe=.35)
    attacker.installed_items.append(load_item("Military Laser"))
    return attacker

def generate_high_level_pirate() -> PirateShip:
    attacker = PirateShip(hitpoints=400, max_hitpoints=400, bravery=random.randint(75,1000), bribe=.75)
    attacker.installed_items.append(load_item("Military Laser"))
    attacker.installed_items.append(load_item("Military Laser"))
    attacker.installed_items.append(load_item("Military Laser"))
    attacker.installed_items.append(load_item("Military Laser"))
    return attacker

def generate_boss_level_pirate() -> PirateShip:
    attacker = PirateShip(hitpoints=2500, max_hitpoints=2500, bravery=10000, bribe=1)
    attacker.installed_items.append(load_item("Military Laser"))
    attacker.installed_items.append(load_item("Military Laser"))
    attacker.installed_items.append(load_item("Military Laser"))
    attacker.installed_items.append(load_item("Military Laser"))
    attacker.installed_items.append(load_item("Military Laser"))
    attacker.installed_items.append(load_item("Military Laser"))
    attacker.installed_items.append(load_item("Military Laser"))
    attacker.installed_items.append(load_item("Military Laser"))
    return attacker


def generate_pirate(ship: Ship) -> list[PirateShip]:
    ship_value = 0
    for item in ship.cargo:
        ship_value += item.buy_price
    for item in ship.installed_items:
        ship_value += item.buy_price

    attackers: list[PirateShip] = []

    luck_roll = random.randint(0, 100)

    ship_danger = (ship_value + abs(ship.coords.x) + abs(ship.coords.y) + abs(ship.coords.z))
    if ship_danger <= 250:
        if luck_roll >= 60:
            attackers.append(generate_low_level_pirate())
        elif luck_roll > 0:
            attackers.append(generate_low_level_pirate())
            attackers.append(generate_low_level_pirate())
        else:
            attackers.append(generate_mid_level_pirate())


    elif ship_danger <= 1000:
        if luck_roll >= 60:
            attackers.append(generate_mid_level_pirate())
        elif luck_roll > 0:
            attackers.append(generate_mid_level_pirate())
            attackers.append(generate_low_level_pirate())
        else:
            attackers.append(generate_high_level_pirate())

        
    elif ship_danger <= 10000:
        if luck_roll >= 60:
            attackers.append(generate_mid_level_pirate())
            attackers.append(generate_mid_level_pirate())

        elif luck_roll > 10:
            attackers.append(generate_mid_level_pirate())
            attackers.append(generate_mid_level_pirate())
            attackers.append(generate_mid_level_pirate())

        else:
            attackers.append(generate_high_level_pirate())
            attackers.append(generate_low_level_pirate())
            attackers.append(generate_low_level_pirate())

    else:
        if luck_roll > 10:
            attackers.append(generate_mid_level_pirate())
            attackers.append(generate_low_level_pirate())
        else:    
            attackers.append(generate_boss_level_pirate())
            attackers.append(generate_mid_level_pirate())
            attackers.append(generate_mid_level_pirate())
            attackers.append(generate_low_level_pirate())
            attackers.append(generate_low_level_pirate())
        

    for attacker in attackers:
        ship.enemies.append(attacker.id)
        attacker.save()
    return attackers

def create_ship(basename: str, username: str) -> Ship:
    user = User.model_validate(users.find_one({"username": username}))
    laser_document = goods.find_one({"name": "Mining Laser"})
    starter_laser = InventoryItem.model_validate(laser_document)
    starter_laser.serial_number = generate_serial(starter_laser.name)
    if user.lost_ships == 0:
        name = basename
    else:
        name = f"{basename} {romanize_number(user.lost_ships + 1)}"
    ship = Ship(name=name, basename=basename, owner=username, installed_items=[starter_laser])
    ship.save()
    user.ship_id = ship.id
    user.save()
    return ship


@app.exception_handler(AuthError)
async def auth_exception_handler(request: Request, exception: AuthError):
    return JSONResponse(
        status_code=401,
        content={"message": str(exception)},
    )

@app.exception_handler(ClientError)
async def client_exception_handler(request: Request, exception: ClientError):
    return JSONResponse(
        status_code=400,
        content={"message": str(exception)},
    )

@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exception: ValidationError):
    return JSONResponse(
        status_code=400,
        content={"message": str(exception)},
    )

@app.post("/admin/nopirates")
async def pirates_off(request: ShipRequest):
    request.ship.no_pirates = True
    for attacker in [get_pirate(id) for id in request.ship.enemies]:
        attacker.delete()
        request.ship.enemies.remove(attacker.id)
    request.ship.save()

@app.post("/admin/yespirates")
async def pirates_on(request: ShipRequest):
    request.ship.no_pirates = False
    request.ship.save()

@app.post("/admin/reset")
async def handle_reset(request: ShipRequest):
    request.ship.coords.x = 0
    request.ship.coords.y = 0
    request.ship.coords.z = 0
    for attacker in [get_pirate(id) for id in request.ship.enemies]:
        attacker.delete()
        request.ship.enemies.remove(attacker.id)
    request.ship.save()

@app.post("/status")
async def get_status(request: GameRequest):
    return "success"

@app.post("/notes/get")
async def get_notes(request: GameRequest):
    document = users.find_one({"username": request.token.username})
    if document == None:
        raise AuthError("invalid token")
    user = User.model_validate(document)
    return user.notes

@app.post("/notes/push")
async def push_notes(request: NoteRequest):
    document = users.find_one({"username": request.token.username})
    if document == None:
        raise AuthError("invalid token")
    user = User.model_validate(document)
    notes = user.notes
    edited_note = None
    for note in notes:
        if request.coords == note.coords:
            edited_note = note
            break
    if edited_note == None:
        edited_note = Note(title=request.title, contents=request.contents, original_timestamp=datetime.now(), edited_timestamp=datetime.now(), coords=request.coords)
        user.notes.append(edited_note)
    else:
        edited_note.title = request.title
        edited_note.contents = request.contents
        edited_note.edited_timestamp = datetime.now()
    user.save()
    return edited_note

@app.post("/notes/remove")
async def delete_note(request: NoteRemoveRequest):
    document = users.find_one({"username": request.token.username})
    if document == None:
        raise AuthError("invalid token")
    user = User.model_validate(document)
    notes = user.notes
    for note in notes:
        if request.coords == note.coords:
            user.notes.remove(note)
            user.save()

@app.post("/register")
async def register(request: RegistrationRequest):
    try:
        users.insert_one({"username": request.username, "hashed_password": security.hash_new_password(request.password)})
        return "successful registration"
    except pymongo.errors.DuplicateKeyError:
        raise ClientError("username not available")

@app.post("/login")
async def login(request: LoginRequest):
    document = users.find_one({"username": request.username})
    if document == None:
        raise AuthError("Incorrect username or password1")
    if not security.verify_hash(request.password, document["hashed_password"]):
        raise AuthError("Incorrect username or password2")
    auth = AuthObject.create(username=request.username)
    return ("login successful", auth)

@app.post("/ship/create")
async def handle_create_ship(request: CreateShipRequest):
    if len(request.ship_name) > 32:
        raise ClientError("Ship name too long, max 32 char")
    return create_ship(request.ship_name, request.token.username)

@app.post("/ship/get")
async def handle_ship_get(request: ShipRequest):
    ship = get_ship(request.token.username)
    return ship, ship.station

@app.post("/cargo/buy")
async def cargo_buy(request: BuyRequest):
    ship = request.ship

    pre_valid_goods = goods.find_one({"name": request.name})
    if pre_valid_goods == None:
        raise ClientError("good doesn't exist")
    goods_to_buy = InventoryItem.model_validate(pre_valid_goods)

    if ship.money <= 0:
        raise ClientError("not enough money!")
    if ship.cargo_used >= ship.cargo_space:
        raise ClientError("out of cargo space!")
    ship.money -= goods_to_buy.buy_price
    goods_to_buy.id = generate_id()
    goods_to_buy.serial_number = generate_serial(goods_to_buy.name)
    ship.cargo.append(goods_to_buy)
    ship.save()
    return ship

@app.post("/cargo/sell")
async def cargo_sell(request: ItemRequest):
    ship = request.ship
    item_id = request.item_id
    if ship.cargo_used <= 0:
        raise ClientError("no cargo to sell")
    item_to_remove = None
    for item in ship.cargo:
        if item.id == item_id:
            item_to_remove = item
            break
    if item_to_remove == None:
        raise ClientError("item not found")
    ship.money += item_to_remove.sell_price
    ship.cargo.remove(item_to_remove)
    ship.save()
    return ship

@app.post("/cargo/install")
async def cargo_install(request: ItemRequest):
    ship = request.ship
    item_id = request.item_id
    if ship.install_space_used >= ship.install_space:
        raise ClientError("no space for installation")
    item_to_install = None
    for item in ship.cargo:
        if item.id == item_id:
            item_to_install = item
            break
    if item_to_install == None:
        raise ClientError("item not found")
    ship.cargo.remove(item_to_install)
    ship.installed_items.append(item_to_install)
    ship.save()
    return ship

@app.post("/cargo/uninstall")
async def cargo_uninstall(request: ItemRequest):
    ship = request.ship
    item_id = request.item_id
    if ship.cargo_used >= ship.cargo_space:
        raise ClientError("no space for uninstallation")
    item_to_uninstall = None
    for item in ship.installed_items:
        if item.id == item_id:
            item_to_uninstall = item
            break
    if item_to_uninstall == None:
        raise ClientError("item not found")
    ship.installed_items.remove(item_to_uninstall)
    ship.cargo.append(item_to_uninstall)
    ship.save()
    return ship

@app.post("/repair/hull")
async def repair_hull(request: NonCombatRequest):
    ship = request.ship
    if ship.money <= 0:
        raise ClientError("no money")
    if ship.hitpoints >= ship.max_hitpoints:
        raise ClientError("hull not damaged")
    ship.money -= 1
    ship.hitpoints += 25
    if ship.hitpoints >= ship.max_hitpoints:
        ship.hitpoints = ship.max_hitpoints
    ship.save()
    return ship

@app.post("/upgrade/hull")
async def upgrade_hull(request: NonCombatRequest):
    ship = request.ship
    if ship.money < 10:
        raise ClientError("not enough money")
    ship.money -= 10
    ship.hitpoints += 10
    ship.max_hitpoints += 10
    ship.save()
    return ship

@app.post("/upgrade/cargo")
async def upgrade_cargo(request: NonCombatRequest):
    ship = request.ship
    if ship.money < 5:
        raise ClientError("not enough money")
    ship.money -= 5
    ship.cargo_space += 1
    ship.save()
    return ship

@app.post("/upgrade/slots")
async def upgrade_slots(request: NonCombatRequest):
    ship = request.ship
    if ship.money < 25:
        raise ClientError("not enough money")
    ship.money -= 25
    ship.install_space += 1
    ship.save()
    return ship

@app.post("/move/{axis}/{direction}")
async def handle_ship_move(request: NonCombatRequest, axis: Axis, direction: Direction):
    ship = request.ship
    if direction == Direction.up:
        ship.coords[axis] += 1
    else:
        ship.coords[axis] -= 1
    if piracy_check(ship):
        generate_pirate(ship)
    ship.save()
    return ship

@app.post("/station/get")
async def handle_station_get(request: NonCombatRequest):
    ship = request.ship
    return ship.station

@app.post("/piracy/get")
async def handle_piracy_get(request: CombatRequest):
    return [get_pirate(id) for id in request.ship.enemies]

@app.post("/piracy/bribe")
async def handle_bribe(request: CombatRequest):
    ship = get_ship(request.token.username)
    amount = 0
    for attacker in [get_pirate(id) for id in ship.enemies]:
        if attacker.bribe >= amount:
            amount = attacker.bribe
        attacker.delete()
        ship.enemies.remove(attacker.id)
    ship.money -= int(ship.money * amount)
    ship.save()
    return ship

@app.post("/piracy/run")
async def handle_piracy_run(request: CombatRequest):
    ship = get_ship(request.token.username)
    #  TODO: fix running away
    for attacker in [get_pirate(id) for id in ship.enemies]:
        attacker.delete()

    ship.enemies = []
    ship.coords[random.choice([Axis.x, Axis.y, Axis.z])] += random.choice([1, -1])
    ship.save()
    return ship


@app.post("/piracy/fight")
async def handle_fight(request: CombatRequest):
    ship = get_ship(request.token.username)
    log: list[LogEvent] = []
    fight_items: list[FightItem] = []
    attackers: list[PirateShip] = [get_pirate(id) for id in ship.enemies]
    for attacker in attackers:
        for item in attacker.installed_items:
            if item.is_weapon:
                fight_items.append(FightItem(ship=attacker, item=item))
    for item in ship.installed_items:
        if item.is_weapon:
            fight_items.append(FightItem(ship=ship, item=item))
    while True:
        for fight_item in fight_items:
            if fight_item.cooldown == 0.0:
                log.append(LogEvent(type=EventType.ITEM_USED, contents=fight_item.item.id))
                fight_item.use(ship, attackers, log)
                fight_item.cooldown = fight_item.item.cooldown

        for attacker in list(attackers):
            if attacker.hitpoints <= 0:
                attackers.remove(attacker)
                ship.enemies.remove(attacker.id)
                log.append(LogEvent(type=EventType.SHIP_DESTROYED, contents=attacker.id))
                fight_items = [fight_item for fight_item in fight_items if fight_item.ship != attacker]
                ship.money += round(attacker.bribe * attacker.bribe * random.randint(500,1000))
                attacker.delete()

        if ship.hitpoints <= 0:
            log.append(LogEvent(type=EventType.SHIP_DESTROYED, contents=ship.id))
            for attacker in attackers:
                attacker.delete()
            ship.delete()
            users.update_one({"username": request.token.username}, {"$inc":{"lost_ships":1}})
            ship = create_ship(ship.basename, request.token.username)
            break

        if not ship.enemies:
            break
        fight_items.sort(key=lambda item: item.cooldown)
        time_elapsed = fight_items[0].cooldown
        for fight_item in fight_items:
            fight_item.cooldown -= time_elapsed
        log.append(LogEvent(type=EventType.TIME_PASSED, contents=time_elapsed))       
    ship.save()
    return log

active_users: set[tuple[str, WebSocket]] = set()

def romanize_number(num: int) -> str:
    result = ""
    while num >= 1000:
        num -= 1000
        result += "M"
    while num >= 500:
        num -= 500
        result += "D"
    while num >= 100:
        num -= 100
        result += "C"
    while num >= 50:
        num -= 50
        result += "L"
    while num >= 10:
        num -= 10
        result += "X"
    if num == 9:
        result += "IX"
    elif num == 8:
        result += "VIII"
    elif num == 7:
        result += "VII"
    elif num == 6:
        result += "VI"
    elif num == 5:
        result += "V"
    elif num == 4:
        result += "IV"
    else:
        result += "I"*num

    return result


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        token = await websocket.receive_json()
        token = AuthObject(**token)
        token.verify()
    except:
        return
    print(f"user: {token.username} connected")
    user_socket = (token.username, websocket)
    active_users.add(user_socket)
    try:
        while True:
            data = await websocket.receive_text()
            for username, user in active_users:
                await user.send_text(f"{token.username}: {data}")
    except:
        active_users.remove(user_socket)
        print(f"user: {token.username} disconnected")



users.create_index("username", unique = True)
goods.create_index("name", unique = True)

utils.initialize_trade_goods()
uvicorn.run(app, host = "0.0.0.0", port = 42000)