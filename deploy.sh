#!/bin/bash
set -e
cp ~/.ssh/id_rsa2 ./back/id_rsa
cp ~/.ssh/id_rsa2.pub ./back/id_rsa.pub
DOCKER_HOST="ssh://administrator@192.168.0.178" docker-compose up --build -d
