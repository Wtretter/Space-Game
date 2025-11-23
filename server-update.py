import argparse
import subprocess

parser = argparse.ArgumentParser()

parser.add_argument("branch")

args = parser.parse_args()

branch = args.branch.split("/")[-1]

print("[!]killing old containers", flush=True)
subprocess.run(["docker", "kill", f"space-game-web-frontend-{branch}"])
subprocess.run(["docker", "kill", f"space-game-api-{branch}"])
subprocess.run(["docker", "kill", f"space-game-db-{branch}"])

print("[!]removing old containers", flush=True)
subprocess.run(["docker", "rm", f"space-game-web-frontend-{branch}"])
subprocess.run(["docker", "rm", f"space-game-api-{branch}"])
subprocess.run(["docker", "rm", f"space-game-db-{branch}"])

print("[!]removing old network", flush=True)
subprocess.run(["docker", "network", "rm", f"space-game-{branch}"])

print("[!]creating new network", flush=True)
subprocess.run(["docker", "network", "create", f"space-game-{branch}"])

print("[!]building new image", flush=True)
subprocess.run(["docker", "build", "-f", "Dockerfile", "-t", f"space-game-api-{branch}", "."])

print("[!]running containers", flush=True)
subprocess.run(["docker", "run", "-d", "--name", f"space-game-db-{branch}", "--network", f"space-game-{branch}", "--hostname", "db", "mongo:latest"])
subprocess.run(["docker", "run", "-d", "--name", f"space-game-api-{branch}", "--network", f"space-game-{branch}", "--hostname", "api", f"space-game-api-{branch}"])
subprocess.run(["docker", "run", "-d", "--name", f"space-game-web-frontend-{branch}", "--network", f"space-game-{branch}", "-v", "./web-frontend:/usr/share/nginx/html", "-v", "./nginx.conf:/etc/nginx/conf.d/default.conf", "-P", "nginx"])

print("[!]pulling random port", flush=True)
port = subprocess.run(["docker", "port", f"space-game-web-frontend-{branch}"], capture_output=True)
print(port.stdout, flush=True)