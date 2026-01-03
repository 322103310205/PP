/* ==============================
   GLOBAL STATE
============================== */

let mapData = null;
let graph = {};

let startNode = null;
let pathSteps = [];
let currentStepIndex = 0;

/* ==============================
   LOAD MAP
============================== */

async function loadMap() {
  const res = await fetch("map.json");
  mapData = await res.json();

  graph = {};
  mapData.nodes.forEach(node => {
    graph[node.id] = {
      x: node.position.x,
      y: node.position.y,
      neighbors: node.connections
    };
  });

  console.log("Map loaded:", graph);
}

/* ==============================
   PATHFINDING (BFS – simple & reliable)
============================== */

function findPath(start, end) {
  const queue = [[start]];
  const visited = new Set([start]);

  while (queue.length > 0) {
    const path = queue.shift();
    const node = path[path.length - 1];

    if (node === end) return path;

    for (const n of graph[node].neighbors) {
      if (!visited.has(n)) {
        visited.add(n);
        queue.push([...path, n]);
      }
    }
  }
  return null;
}

/* ==============================
   DIRECTION CALCULATION
============================== */

function getDirection(from, to) {
  const dx = graph[to].x - graph[from].x;
  const dy = graph[to].y - graph[from].y;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "RIGHT" : "LEFT";
  } else {
    return dy > 0 ? "BACK" : "FORWARD";
  }
}

/* ==============================
   NAVIGATION API (USED BY index.html)
============================== */

function setStartNode(nodeId) {
  startNode = nodeId;
  console.log("Start node set:", nodeId);
}

function navigateTo(destination) {
  if (!startNode || !graph[destination]) return null;

  const path = findPath(startNode, destination);
  if (!path || path.length < 2) return null;

  pathSteps = [];
  for (let i = 1; i < path.length; i++) {
    pathSteps.push({
      from: path[i - 1],
      to: path[i],
      action: getDirection(path[i - 1], path[i])
    });
  }

  currentStepIndex = 0;
  console.log("Path:", pathSteps);
  return pathSteps[0];
}

function onNodeReached(nodeId) {
  if (!pathSteps.length) return null;

  if (pathSteps[currentStepIndex].to !== nodeId) {
    return null;
  }

  currentStepIndex++;

  if (currentStepIndex >= pathSteps.length) {
    console.log("Destination reached");
    return null;
  }

  return pathSteps[currentStepIndex];
}
