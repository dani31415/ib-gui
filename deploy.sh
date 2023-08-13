#!/bin/bash
set -e
cp /mnt/c/Users/dani3/.ssh/id_rsa ./back/id_rsa
DOCKER_HOST="ssh://administrator@casa" docker-compose up --build -d
