import pymongo
from pymongo.collection import Collection

client = pymongo.MongoClient("mongodb://db:27017/")

database = client["space-game"]

users: Collection = database["users"]
ships: Collection = database["ships"]
goods: Collection = database["goods"]