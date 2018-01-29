#!/bin/bash

export DEBUG=true
export NODE_ENV=development
brew services start redis
brew services start mongodb
