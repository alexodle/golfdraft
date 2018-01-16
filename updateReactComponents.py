#!/bin/python

import sys
import re
import glob
import os


CREATE_CLASS = re.compile(r'([A-Za-z_0-9]+) *= *React\.createClass\({')
METHOD = re.compile(r'([A-Za-z_0-9]+): function +')

lines = []


def assert_opposite(open_ch, close_ch):
  assert (open_ch == '{' and close_ch == '}') or (open_ch == '(' and close_ch == ')'), 'open/close fail: %s, %s' % (open_ch, close_ch)


def replace_method(f, l):
  lines.append(METHOD.sub(r'\1', l))

  stack = ['{']
  for l in f:
    for ch in l:
      if ch == '{' or ch == '(':
        stack.append(ch)
      elif ch == '}' or ch == ')':
        chrm = stack.pop()
        assert_opposite(chrm, ch)

    if len(stack):
      lines.append(l)
    else:
      lines.append(l.replace('},', '}'))
      return


def replace_class(f, m):
  lines.append('class %s extends React.Component {' % m.groups(1))

  stack = ['(', '{']
  for l in f:
    for ch in l:
      if ch == '{' or ch == '(':
        stack.append(ch)
      elif ch == '}' or ch == ')':
        chrm = stack.pop()
        assert_opposite(chrm, ch)

    if stack:
      if len(stack) == 2:
        l = l.replace('},', '}')
      lines.append(METHOD.sub(r'\1' , l))
    else:
      lines.append(l.replace('})', '}'))
      return


def main(fp):
  global lines
  lines = []

  with open(fp, 'r') as f:
    for l in f:
      m = CREATE_CLASS.search(l)
      if m:
        replace_class(f, m)
      else:
        lines.append(l)

  with open(fp, 'w') as f:
    f.writelines(lines)


def run_on_dir(dir):
  for root, dirs, files in os.walk(dir):
    for file in files:
        if file.endswith('.jsx'):
             main(os.path.join(root, file))


if __name__ == '__main__':
  run_on_dir('js/')
