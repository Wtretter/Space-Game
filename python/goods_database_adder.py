from models import Goods


while True:
    goods_name = input("please type an item to add to the GOODS database: ")
    buy_price = input("buyprice: ")
    sell_price = input("sellprice: ")
    rarity = input("rarity: ")
    confirmation = input(f"Confirm you would like to add {goods_name} at a buy price of {buy_price}, a sell price of {sell_price}, and a rarity of {rarity} Y/N\n").lower
    x = confirmation()
    if x == "y":
        trade_good = Goods(name=goods_name, buy_price=buy_price, sell_price=sell_price, rarity=rarity)
        trade_good.save()
    elif confirmation == "exit":
        break
    else:
        continue
