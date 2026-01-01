let mapData = null;
let graph = {};

let startNode = null;
let activeSteps = [];
let currentStepIndex = 0;
let currentTargetNode = null;

/* ---------- LOAD MAP ---------- */
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

  console.log("Map loaded");
}

/* ---------- PATHFINDING (A*) ---------- */
function heuristic(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function aStar(start, goal) {
  const open = new Set([start]);
  const cameFrom = {};
  const g = {}, f = {};

  Object.keys(graph).forEach(k => {
    g[k] = Infinity;
    f[k] = Infinity;
  });

  g[start] = 0;
  f[start] = heuristic(graph[start], graph[goal]);

  while (open.size) {
    const current = [...open].reduce((a, b) =>
      f[a] < f[b] ? a : b
    );

    if (current === goal) return reconstruct(cameFrom, current);

    open.delete(current);

    for (const n of graph[current].neighbors) {
      const temp = g[current] + heuristic(graph[current], graph[n]);
      if (temp < g[n]) {
        cameFrom[n] = current;
        g[n] = temp;
        f[n] = temp + heuristic(graph[n], graph[goal]);
        open.add(n);
      }
    }
  }
  return null;
}

function reconstruct(cameFrom, cur) {
  const path = [cur];
  while (cameFrom[cur]) {
    cur = cameFrom[cur];
    path.unshift(cur);
  }
  return path;
}

/* ---------- DIRECTION ---------- */
function direction(from, to) {
  const dx = graph[to].x - graph[from].x;
  const dy = graph[to].y - graph[from].y;

  if (Math.abs(dx) > Math.abs(dy))
    return dx > 0 ? "RIGHT" : "LEFT";
  return dy > 0 ? "BACK" : "FORWARD";
}

/* ---------- NAVIGATION API ---------- */
export function setStartNode(node) {
  startNode = node;
}

export function navigateTo(dest) {
  const path = aStar(startNode, dest);
  if (!path || path.length < 2) return null;

  activeSteps = [];
  for (let i = 1; i < path.length; i++) {
    activeSteps.push({
      from: path[i - 1],
      to: path[i],
      action: direction(path[i - 1], path[i])
    });
  }

  currentStepIndex = 0;
  currentTargetNode = activeSteps[0].to;
  return activeSteps[0];
}

export function onNodeReached(node) {
  if (node !== currentTargetNode) return null;

  currentStepIndex++;
  if (currentStepIndex >= activeSteps.length) {
    console.log("Destination reached");
    return null;
  }

  currentTargetNode = activeSteps[currentStepIndex].to;
  return activeSteps[currentStepIndex];
}
