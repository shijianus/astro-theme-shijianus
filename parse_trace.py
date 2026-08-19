import json
import sys

def parse_trace(filename):
    with open(filename, 'r') as f:
        trace = json.load(f)
    
    events = trace.get('traceEvents', [])
    stats = {}
    for ev in events:
        name = ev.get('name')
        dur = ev.get('dur', 0) / 1000.0 # ms
        if name in ['UpdateLayerTree', 'Paint', 'Layout', 'UpdateLayoutTree', 'CompositeLayers', 'GPUTask', 'DrawFrame']:
            stats[name] = stats.get(name, 0) + dur
    return stats

try:
    print("Light:", parse_trace('trace_light.json'))
    print("Dark:", parse_trace('trace_dark.json'))
except Exception as e:
    print(e)
