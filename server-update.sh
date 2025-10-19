sudo systemctl stop space-game.service

sudo cp -r web-frontend/* /usr/share/nginx/html/

sudo systemctl start space-game.service