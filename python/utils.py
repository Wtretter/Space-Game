from models import Goods, Position
from database import goods
import json

def initialize_trade_goods():
    goods.delete_many({})

    with open("goods.json") as goods_file:
        goods_doc = json.load(goods_file)

    for name, trade_good in goods_doc.items():
        new_good = Goods(
            name=name,
            buy_price=trade_good["buy_price"],
            sell_price=trade_good["sell_price"],
            rarity=trade_good["rarity"]
        )
        new_good.save()





