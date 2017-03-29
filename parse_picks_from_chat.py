"""Ex:

Kyle Phillips picks Andy Sullivan
"""

import re
import sys
from collections import defaultdict

MAX_PICKS = 4

pickre = re.compile(r'([A-Z][a-z]+ [A-Z][a-z]+) picks ([^\(]+)')

# Sanity
picks_by_golfer = {}
picks_by_player = defaultdict(list)

picks = []
with open(sys.argv[1]) as f:
  for l in f:
    l = l.strip()
    m = pickre.match(l)
    if m:
      p, g = m.groups()
      g = g.strip()

      pick = (p, g)
      if g in picks_by_golfer:
        raise Exception('Golfer picked more than once: %s and %s' % (pick, picks_by_golfer[g]))

      picks_by_player[p].append(pick)
      if len(picks_by_player[p]) > MAX_PICKS:
        raise Exception('Too many picks for player: %s' % picks_by_player[p])

      picks.append(pick)

for p in picks_by_player.itervalues():
  if len(p) != MAX_PICKS:
    raise Exception('Too few picks for player: %s' % p)

for p, g in picks:
  print '%s,%s' % (p, g)
