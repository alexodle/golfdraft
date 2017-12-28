import re


NON_CHAR = re.compile(r'[^a-z]')
NON_ORIGINAL_HIT = .1


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
  wtoperm_orig = without_non_chars(wtoperm)

  for wperm in word_permutations(wtoperm):
    wperm = without_non_chars(wperm)
    is_original = wperm == wtoperm_orig
    yield wperm, wnonperm, is_original


def compute_cost(w1orig, w2orig):
  global memo_costs
  w1 = clean_word(w1orig)
  w2 = clean_word(w2orig)

  best_cost = None
  best_combo = None
  complexity = 0
  for testw1, testw2, is_original in all_word_permuations(w1, w2):
    memo_costs = {}
    cost = memoized_calc_cost(testw1, testw2, 0, 0)
    complexity += len(memo_costs)

    if best_cost == None or cost < best_cost:
      best_cost = cost
      best_combo = (testw1, testw2)
      if best_cost == 0:
        break

  total_len = len(best_combo[0]) + len(best_combo[1])
  likeness = (total_len - best_cost * 1.0) / total_len

  return {
    'complexity': complexity,
    'cost': best_cost,
    'normalized_words': best_combo,
    'original_words': (w1orig, w2orig),
    'likeness': likeness
  }


if __name__ == '__main__':
  import sys

  MIN_LIKENESS = 0.6

  names = {
     "Billy Hurley-III": "Billy Hurley III",
      "Charles Howell-III": "Charles Howell III",
      "Giwhan Kim": "Gi-whan Kim",
      "Graham Delaet": "Graham DeLaet",
      "Jin Cheng": "Cheng Jin",
      "Joseph Dean": "Joe Dean",
      "Juan Sebastian Munoz": "Sebastian Munoz",
      "Li Haotong": "Hao Tong Li",
      "Liang Wen-chong": "Wen-Chong Liang",
      "Maximilian Kieffer": "Max Kieffer",
      "Miguel A Jimenez": "Miguel Angel Jimenez",
      "Rafael Cabrera Bello": "Rafa Cabrera Bello",
      "Sanghee Lee": "Sang-hee Lee",
      "Seukhyun Baek": "Seuk Hyun Baek",
      "Seungyul Noh": "Seung-Yul Noh",
      "Siwoo Kim": "Si Woo Kim",
      "Steven Alker": "Steve Alker",
      "Sunghoon Kang": "Sung Kang",
      "Tjaart Van Der Walt": "Tjaart van der Walt",
      "Tyrone van Aswegen": "Tyrone Van Aswegen",
      "Yikeun Chang": "Yi Keun Chang",
      "Younghan Song": "Young-han Song"
      }

  for k in names.iterkeys():
    matches = [compute_cost(k, v) for v in names.itervalues()]
    matches = [m for m in matches if m['likeness'] > MIN_LIKENESS]
    matches = sorted(matches, key=lambda m: m['likeness'], reverse=True)
    print k
    for m in matches:
      print '\t(%f:00) - %s' % (m['likeness'], m['original_words'][1])

  #for i in xrange(200 * 20):
  #  compute_cost(sys.argv[1], sys.argv[2])

  #print compute_cost(sys.argv[1], sys.argv[2])['likeness']
