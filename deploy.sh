#!/bin/bash
set -e
DOCKER_HOST="ssh://administrator@casa" docker-compose up --build -d
