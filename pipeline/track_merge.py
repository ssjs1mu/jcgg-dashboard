#!/usr/bin/env python3
"""Merge today's Big Fish / Big Fish Short trigger outcomes into the running forward log (kept on branch `track`).
track.json = {'since','updated','days':{date:{'final':bool,'bf':{sym:[time,px,outcome,ret]},'bs':{...}}}} ; last 150 days kept; today's entry is replaced on every run."""
import json, os, sys
old = {}
try: old = json.load(open(sys.argv[1]))
except Exception: pass
t = json.load(open(sys.argv[2])); days = old.get('days', {})
days[t['date']] = {'final': t['final'], 'bf': t['bf'], 'bs': t['bs']}
keep = sorted(days)[-150:]
out = {'since': old.get('since') or t['date'], 'updated': t['ts'], 'rule': 'entry at trigger price; +1.5% target vs -1.5% stop, first touch on 5-min bars (both in one bar = stop first); else marked at last bar; costs not included here', 'days': {k: days[k] for k in keep}}
json.dump(out, open(sys.argv[3], 'w'), separators=(',', ':'))
print('track days', len(out['days']), 'today bf', len(t['bf']), 'bs', len(t['bs']))
