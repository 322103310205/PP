let mapData = null;
let graph = {};
let startNode = null;
let steps = [];
let index = 0;
let target = null;

export async function loadMap() {
  const res = await fetch("map.json");
  mapData = await res.json();

  mapData.nodes.forEach(n => {
    graph[n.id] = {
      x: n.position.x,
      y: n.position.y,
      neighbors: n.connections
    };
  });
}

function heuristic(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function aStar(start, goal) {
  const open = new Set([start]);
  const came = {};
  const g = {};
  const f = {};

  Object.keys(graph).forEach(n => {
    g[n] = Infinity;
    f[n] = Infinity;
  });

  g[start] = 0;
  f[start] = heuristic(graph[start], graph[goal]);

  while (open.size) {
    const current = [...open].reduce((a, b) => f[a] < f[b] ? a : b);
    if (current === goal) return buildPath(came, current);

    open.delete(current);

    for (const n of graph[current].neighbors) {
      const temp = g[current] + heuristic(graph[current], graph[n]);
      if (temp < g[n]) {
        came[n] = current;
        g[n] = temp;
        f[n] = temp + heuristic(graph[n], graph[goal]);
        open.add(n);
      }
    }
  }
  return null;
}

function buildPath(came, cur) {
  const path = [cur];
  while (came[cur]) {
    cur = came[cur];
    path.unshift(cur);
  }
  return path;
}

function direction(from, to) {
  const dx = graph[to].x - graph[from].x;
  const dy = graph[to].y - graph[from].y;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "RIGHT" : "LEFT";
  return dy > 0 ? "BACK" : "FORWARD";
}

export function setStartNode(n) {
  startNode = n;
}

export function navigateTo(dest) {
  const path = aStar(startNode, dest);
  if (!path || path.length < 2) return null;

  steps = [];
  for (let i = 1; i < path.length; i++) {
    steps.push({
      from: path[i - 1],
      to: path[i],
      action: direction(path[i - 1], path[i])
    });
  }

  index = 0;
  target = steps[0].to;
  return steps[0];
}

export function onNodeReached(node) {
  if (node !== target) return null;
  index++;
  if (index >= steps.length) return null;
  target = steps[index].to;
  return steps[index];
}
