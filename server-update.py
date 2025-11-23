import argparse
import subprocess

parser = argparse.ArgumentParser()

parser.add_argument("branch")

args = parser.parse_args()

branch = args.branch.split("/")[-1]

subprocess.run(["docker", "kill", f"space-game-web-frontend-{branch}"])
subprocess.run(["docker", "kill", f"space-game-api-{branch}"])
subprocess.run(["docker", "kill", f"space-game-db-{branch}"])

subprocess.run(["docker", "rm", f"space-game-web-frontend-{branch}"])
subprocess.run(["docker", "rm", f"space-game-api-{branch}"])
subprocess.run(["docker", "rm", f"space-game-db-{branch}"])

subprocess.run(["docker", "network", "rm", f"space-game-{branch}"])

subprocess.run(["docker", "network", "create", f"space-game-{branch}"])

subprocess.run(["docker", "build", "-f", "Dockerfile", "-t", f"space-game-api-{branch}"])

subprocess.run(["docker", "run", "--name", f"space-game-db-{branch}", "--network", f"space-game-{branch}", "mongo:latest"])
subprocess.run(["docker", "run", "--name", f"space-game-api-{branch}", "--network", f"space-game-{branch}", f"space-game-api-{branch}"])
subprocess.run(["docker", "run", "--name", f"space-game-web-frontend-{branch}", "--network", f"space-game-{branch}", "-v", "./web-frontend:/usr/share/nginx/html", "-v", "./nginx.conf:/etc/nginx/conf.d/default.conf", "-P", "nginx"])

port = subprocess.run(["docker", "port", f"space-game-web-frontend-{branch}"], capture_output=True)
print(port)