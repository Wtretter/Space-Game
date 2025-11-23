echo $GITHUB_REF
if [[ $GITHUB_REF == "refs/heads/main" ]]; then

    docker compose down

    docker compose build

    docker compose up -d
else
    python3 server_update.py $GITHUB_REF
fi

# refs/heads/dev
