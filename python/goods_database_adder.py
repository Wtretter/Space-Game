from models import InventoryItem
import json


while True:
    goods_name = input("please type an item to add to the Goods database: ")
    buy_price = input("buyprice: ")
    sell_price = input("sellprice: ")
    rarity = input("rarity: ")
    confirmation = input(f"Confirm you would like to add {goods_name} at a buy price of {buy_price}, a sell price of {sell_price}, and a rarity of {rarity} Y/N\n").lower()
    if confirmation == "y":
        trade_good = InventoryItem(name=goods_name, buy_price=buy_price, sell_price=sell_price, rarity=rarity)

        with open("../goods.json") as goods_file:
            goods_doc = json.load(goods_file)

        goods_list: list[InventoryItem] = [trade_good]

        for name, trade_good in goods_doc.items():
            new_good = InventoryItem(
                name=name,
                buy_price=trade_good["buy_price"],
                sell_price=trade_good["sell_price"],
                rarity=trade_good["rarity"]
            )
            goods_list.append(new_good)
        
        trade_goods_as_dict = dict()
        for trade_good in goods_list:
            trade_goods_as_dict[trade_good.name] = trade_good.model_dump(mode='json', exclude=["id", "name"])
        print(trade_goods_as_dict)

        with open("../goods.json", "w") as newfile:
            json.dump(trade_goods_as_dict, newfile, indent=2)
    else:
        break