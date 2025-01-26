from models import InventoryItem, Position
from database import goods
import json

def initialize_trade_goods():
    goods.delete_many({})

    with open("../goods.json") as goods_file:
        goods_doc = json.load(goods_file)

    for name, trade_good in goods_doc.items():
        new_good = InventoryItem(
            name=name,
            **trade_good,
        )
        if new_good.damage != 0.0:
            new_good.is_weapon = True
        new_good.save()





