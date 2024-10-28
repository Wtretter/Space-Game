from __future__ import annotations
from database import ships, users, goods
from pydantic import BaseModel, Field
from bson import ObjectId
from typing import Annotated, Optional
from pydantic.functional_validators import BeforeValidator
import random


def generate_ship_name() -> str:
    ship_names = ("testpirate1", "testpirate2", "testpirate3")
    return random.choice(ship_names)

def generate_station_name(generator: random.Random) -> str:
    station_names = ("teststation1", "teststation2", "teststation3")
    return generator.choice(station_names)

def generate_goods(generator: random.Random) -> list:
    db_goods = goods.find({})
    available_goods = []
    for trade_good in [Goods.model_validate(trade_good) for trade_good in db_goods]:
        if trade_good.rarity < generator.randint(1,100):
            available_goods.append(trade_good)
    return available_goods

def get_station(generator: random.Random) -> Station:
    station = Station(name=generate_station_name(generator), sale_goods=generate_goods(generator))
    return station

def entry_id_validator(value: ObjectId):
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
    id: Annotated[str, BeforeValidator(entry_id_validator)] = Field(default_factory=lambda: ObjectId().binary.hex(), validation_alias="_id")

    @property
    def _id(self) -> ObjectId:
        return ObjectId(self.id)

class Goods(DatabaseEntry):
    name: str
    buy_price: int
    sell_price: int
    rarity: int

    def save(self):
        goods.update_one({"_id": self._id}, {"$set": self.model_dump()}, upsert=True)

class Station(BaseModel):
    name: str
    sale_goods: list[Goods]
class Ship(DatabaseEntry):
    name: str = Field(default_factory=generate_ship_name)
    owner: Optional[str] = None
    attack_damage: int = 0
    hitpoints: int = 100
    cargo_space: int = 10
    money: int = 10
    coords: Position = Field(default_factory=Position)
    enemies: list[str] = Field(default_factory=list)
    jump_cooldown_amount: int = 1
    time_in_combat: int = 0
    cargo: list = Field(default_factory=list)
    no_pirates: bool = False

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

    def save(self):
        ships.update_one({"_id": self._id}, {"$set": self.model_dump()}, upsert=True)

    def delete(self):
        ships.find_one_and_delete({"_id": self._id})

class User(DatabaseEntry):
    username: str
    hashed_password: str
    ship_id: Optional[str] = None
    lost_ships: int = 0

    def save(self):
        users.update_one({"_id": self._id}, {"$set": self.model_dump()}, upsert=True)

class PirateShip(Ship):
    bravery: int
    bribe: float

