from __future__ import annotations
from database import ships, users, goods
from pydantic import BaseModel, Field, AliasChoices
from bson import ObjectId
from typing import Annotated, Optional, Any
from pydantic.functional_validators import BeforeValidator
from enum import Enum
import random
import string
from datetime import datetime


class DamageType(str, Enum):
    LASER="Laser"
    KINETIC="Kinetic"
    EXPLOSIVE="Explosive"
    EMP="EMP"

class EventType(str, Enum):
    SHIP_DESTROYED="Ship Destroyed"
    ITEM_USED="Item Used"
    TIME_PASSED="Time Passed"
    DAMAGE_TAKEN="Damage Taken"
    DODGED="Dodged"

def generate_ship_name() -> str:
    ship_names = ("TestPirate I", "TestPirate II", "TestPirate III", "TestPirate IV", "TestPirate V")
    return random.choice(ship_names)

def generate_id() -> str:
    return ObjectId().binary.hex()

def generate_serial(name: str) -> str:
    serial = ""
    length = random.randint(4,6)
    for word in name.split():
        serial += word[0].upper()
    serial += "-"
    for i in range(length):
        serial += random.choice(string.ascii_uppercase + string.digits)
    return serial

def generate_station_name(generator: random.Random) -> str:
    station_names = ("TestStation I", "TestStation II", "TestStation III", "TestStation IV", "TestStation V")
    return generator.choice(station_names)

def generate_goods(generator: random.Random) -> list:
    db_goods = goods.find({})
    available_goods = []
    for trade_good in [InventoryItem.model_validate(trade_good) for trade_good in db_goods]:
        if trade_good.rarity < generator.randint(1,100):
            available_goods.append(trade_good)
    return available_goods

def get_station(generator: random.Random) -> Station:
    station = Station(name=generate_station_name(generator), sale_goods=generate_goods(generator))
    return station

def entry_id_validator(value: ObjectId | str):
    if isinstance(value, str):
        return value
    else:
        return value.binary.hex()

class Position(BaseModel):
    x: int = 0
    y: int = 0
    z: int = 0

    def __getitem__(self, key: str) -> int:
        return getattr(self, key)

    def __setitem__(self, key: str, value: int):
        setattr(self, key, value)

    @property
    def bytes(self) -> bytes:
        return self.x.to_bytes(8, "big", signed=True) + self.y.to_bytes(8, "big", signed=True) + self.z.to_bytes(8, "big", signed=True)

class DatabaseEntry(BaseModel):
    id: Annotated[str, BeforeValidator(entry_id_validator)] = Field(
        default_factory=generate_id,
        validation_alias=AliasChoices("_id", "id")
    )

    @property
    def _id(self) -> ObjectId:
        return ObjectId(self.id)
    
class LogEvent(BaseModel):
    type: EventType
    contents: Any

class InventoryItem(DatabaseEntry):
    # common attributes
    name: str
    buy_price: int
    sell_price: int
    rarity: int
    installable: bool = False
    serial_number: Optional[str] = None
    # weapon attributes
    is_weapon: bool = False
    damage_type: Optional[DamageType] = None
    damage: float = 0.0
    cooldown: float = 0.0
    ammo_cost: int = 0
    ammo_type: Optional[str] = None
    energy_cost: float = 0.0
    accuracy: float = 0.0
    # defensive attributes
    dodge_chance: float = 0.0 
    damage_reduction: float = 0.0

    def save(self):
        goods.update_one({"_id": self._id}, {"$set": self.model_dump()}, upsert=True)

class FightItem(BaseModel):
    ship: Ship
    item: InventoryItem
    cooldown: float = 0.0

    def use(self, ship: Ship, attackers: list[PirateShip], log: list[LogEvent]):
        if self.item.is_weapon:
            if self.ship == ship:
                target = random.choice(attackers)
            else:
                target = ship
            accuracy = random.random() + self.item.accuracy
            if accuracy > target.dodge_chance:
                attack_damage = (self.item.damage * (random.randint(75,125) / 100))
                target.hitpoints -= attack_damage
                log.append(LogEvent(type=EventType.DAMAGE_TAKEN, contents=(self.ship.id, target.id, attack_damage, self.item.damage_type)))
            else:
                log.append(LogEvent(type=EventType.DODGED, contents=target.id))
class Station(BaseModel):
    name: str
    sale_goods: list[InventoryItem]

class Ship(DatabaseEntry):
    name: str = Field(default_factory=generate_ship_name)
    owner: Optional[str] = None
    hitpoints: float = 100.0
    max_hitpoints: float = 100.0
    cargo_space: int = 10
    install_space: int = 2
    money: int = 10
    coords: Position = Field(default_factory=Position)
    enemies: list[str] = Field(default_factory=list)
    jump_cooldown_amount: float = 5.0

    cargo: list[InventoryItem] = Field(default_factory=list)
    installed_items: list[InventoryItem] = Field(default_factory=list)
    no_pirates: bool = False
    energy: int = 10

    @property
    def station(self) -> Station | None:
        generator = random.Random()
        generator.seed(self.coords.bytes)
        if generator.randint(1,100) >= 80:
            station = get_station(generator)
            return station
        else:
            return None

    @property
    def in_combat(self) -> bool:
        return len(self.enemies) != 0

    @property
    def cargo_used(self) -> int:
        return len(self.cargo)

    @property
    def install_space_used(self) -> int:
        return len(self.installed_items)
    
    @property
    def dodge_chance(self) -> float:
        return sum(item.dodge_chance for item in self.installed_items)

    def save(self):
        ships.update_one({"_id": self._id}, {"$set": self.model_dump()}, upsert=True)

    def delete(self):
        ships.find_one_and_delete({"_id": self._id})

class Note(BaseModel):
    title: str
    content: str
    coords: Position
    original_timestamp: datetime
    edited_timestamp: datetime


class User(DatabaseEntry):
    username: str
    hashed_password: str
    ship_id: Optional[str] = None
    lost_ships: int = 0
    notes: list[Note] = Field(default_factory=list)

    def save(self):
        users.update_one({"_id": self._id}, {"$set": self.model_dump()}, upsert=True)

class PirateShip(Ship):
    bravery: int
    bribe: float

