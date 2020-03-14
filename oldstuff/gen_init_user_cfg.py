#!/bin/python

"""Generates unique passwords for everyone in the given tourney_cfg. Should be a temporary stop-gap.
"""

import json
import sys
import random
import string

# Letters + numbers that avoid ambiguity
UPPERCASE = list(set(string.ascii_uppercase) - set(['O', 'I']))
LOWERCASE = list(set(string.ascii_lowercase) - set(['o', 'l']))
NUMBERS = [str(n) for n in [2,3,4,5,6,7,8,9]]
CHOICES = UPPERCASE + LOWERCASE + NUMBERS

PW_LENGTH = 6

def gen_pw():
    return ''.join(random.choice(CHOICES) for _ in range(PW_LENGTH))

user_cfg = {}
with open(sys.argv[1]) as f:
    cfg = json.load(f)
    users = cfg['draftOrder']
    for n in users:
        user_cfg[n] = { 'password': gen_pw() }

print json.dumps(user_cfg, indent=2)