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

  console.log("Map loaded with nodes:", graph);
}

/* ---------- A* HEURISTIC ---------- */
function heuristic(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/* ---------- A* PATHFINDING ---------- */
function aStar(start, goal) {
  const openSet = new Set([start]);
  const cameFrom = {};

  const gScore = {};
  const fScore = {};

  Object.keys(graph).forEach(n => {
    gScore[n] = Infinity;
    fScore[n] = Infinity;
  });

  gScore[start] = 0;
  fScore[start] = heuristic(graph[start], graph[goal]);

  while (openSet.size > 0) {
    const current = [...openSet].reduce((a, b) =>
      fScore[a] < fScore[b] ? a : b
    );

    if (current === goal) {
      return reconstructPath(cameFrom, current);
    }

    openSet.delete(current);

    for (const neighbor of graph[current].neighbors) {
      const tentativeG =
        gScore[current] +
        heuristic(graph[current], graph[neighbor]);

      if (tentativeG < gScore[neighbor]) {
        cameFrom[neighbor] = current;
        gScore[neighbor] = tentativeG;
        fScore[neighbor] =
          tentativeG + heuristic(graph[neighbor], graph[goal]);
        openSet.add(neighbor);
      }
    }
  }
  return null;
}

/* ---------- PATH RECONSTRUCTION ---------- */
function reconstructPath(cameFrom, current) {
  const path = [current];
  while (cameFrom[current]) {
    current = cameFrom[current];
    path.unshift(current);
  }
  return path;
}

/* ---------- DIRECTION ---------- */
function getDirection(from, to) {
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
  if (!startNode || !graph[dest]) return null;

  const path = aStar(startNode, dest);
  if (!path || path.length < 2) return null;

  activeSteps = [];
  for (let i = 1; i < path.length; i++) {
    activeSteps.push({
      from: path[i - 1],
      to: path[i],
      action: getDirection(path[i - 1], path[i])
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
