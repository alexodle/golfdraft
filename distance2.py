import re


NON_CHAR = re.compile(r'[^a-z]')


def permutations(wl, wr):
  if len(wr) == 0:
    yield wl
  for i, ch in enumerate(wr):
    for e in permutations(
        wl + ch,
        wr[0:i] + wr[i+1:len(wr)]):
      yield e


def word_permutations(w):
  for wperm in permutations('', w.split(' ')):
    yield wperm


def clean_word(w):
  return w.lower()


def without_non_chars(w):
  return NON_CHAR.sub('', w)


memo_costs = {}
def memoized_calc_cost(w1, w2, i1, i2):
  k = (i1, i2)
  if k in memo_costs:
    return memo_costs[k]

  cost = calc_cost(w1, w2, i1, i2)

  memo_costs[k] = cost
  return cost


def calc_cost(w1, w2, i1, i2):
  while i1 < len(w1) and i2 < len(w2) and w1[i1] == w2[i2]:
    i1 += 1
    i2 += 1

  if i1 == len(w1) and i2 == len(w2):
    return 0

  if i1 == len(w1) or i2 == len(w2):
    return (len(w1) - i1) + (len(w2) - i2)

  cost1 = memoized_calc_cost(w1, w2, i1 + 1, i2)
  cost2 = memoized_calc_cost(w1, w2, i1, i2 + 1)
  cost = 1 + min(cost1, cost2)

  return cost


def all_word_permuations(w1, w2):
  wc1 = len(w1.split(' '))
  wc2 = len(w2.split(' '))

  wtoperm = w1 if wc1 > wc2 else w2
  wnonperm = without_non_chars(w1 if wtoperm != w1 else w2)

  for wperm in word_permutations(wtoperm):
    wperm = without_non_chars(wperm)
    yield wperm, wnonperm


if __name__ == '__main__':
  import sys

  w1 = clean_word(sys.argv[1])
  w2 = clean_word(sys.argv[2])

  best_cost = None
  best_combo = None
  complexity = 0
  for testw1, testw2 in all_word_permuations(w1, w2):
    memo_costs = {}
    cost = memoized_calc_cost(testw1, testw2, 0, 0)
    complexity += len(memo_costs)

    if best_cost == None or cost < best_cost:
      best_cost = cost
      best_combo = (testw1, testw2)
      if best_cost == 0:
        break
  
  print 'Complexity: %s' % complexity
  print 'Cost: %s, %s' % (best_cost, best_combo)

  total_len = len(best_combo[0]) + len(best_combo[1])
  print 'Likeness coefficient: %s' % ((total_len - best_cost * 1.0) / total_len)
