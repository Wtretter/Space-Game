import argparse
import subprocess

parser = argparse.ArgumentParser()

parser.add_argument("branch")

args = parser.parse_args()

branch = args.branch.split("/")[-1]

subprocess.run("docker kill space-game-web-frontend-{branch}")
subprocess.run("docker kill space-game-api-{branch}")
subprocess.run("docker kill space-game-db-{branch}")

subprocess.run("docker rm space-game-web-frontend-{branch}")
subprocess.run("docker rm space-game-api-{branch}")
subprocess.run("docker rm space-game-db-{branch}")

subprocess.run("docker network rm space-game-{branch}")

subprocess.run("docker network create space-game-{branch}")

subprocess.run("docker build -f Dockerfile -t space-game-api-{branch}")

subprocess.run("docker run --name space-game-db-{branch} --network space-game-{branch} mongo:latest")
subprocess.run("docker run --name space-game-api-{branch} --network space-game-{branch} space-game-api-{branch}")
subprocess.run("docker run --name space-game-web-frontend-{branch} --network space-game-{branch} -v ./web-frontend:/usr/share/nginx/html -v ./nginx.conf:/etc/nginx/conf.d/default.conf -P nginx")

port = subprocess.run("docker port space-game-web-frontend-{branch}", capture_output=True)
print(port)