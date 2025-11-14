document.addEventListener("DOMContentLoaded", () => {

// ---------------------------
// GLOBALS
// ---------------------------
let processes = [];
let timeline = [];
let quantum = 4;
let idx = 0;
let playing = false;
let timer;

// DOM
const tbody = document.getElementById("processBody");
const gantt = document.getElementById("gantt");
const events = document.getElementById("events");

// ---------------------------
// ADD PROCESS
// ---------------------------
document.getElementById("addProcess").onclick = () => {

  const pid = "P" + (processes.length + 1);
  const arrival = Math.floor(Math.random() * 10);
  const burst = Math.floor(Math.random() * 10) + 1;
  const priority = Math.floor(Math.random() * 5) + 1;

  processes.push({
    pid,
    arrival,
    burst,
    priority,
    remaining: burst
  });

  renderTable();
};

// ---------------------------
// CLEAR ALL
// ---------------------------
document.getElementById("clear").onclick = () => {
  processes = [];
  timeline = [];
  idx = 0;
  playing = false;
  tbody.innerHTML = "";
  gantt.innerHTML = "";
  events.innerHTML = "";
  resetStats();
};

// ---------------------------
// BUILD SCHEDULE
// ---------------------------
document.getElementById("build").onclick = () => {

  saveEdits();
  quantum = parseInt(document.getElementById("quantum").value);

  if (processes.length === 0) return;

  buildRR();
  previewGantt();
};

// ---------------------------
// BUTTON CONTROLS
// ---------------------------
document.getElementById("play").onclick = () => play();
document.getElementById("pause").onclick = () => pause();
document.getElementById("step").onclick = () => step();
document.getElementById("reset").onclick = () => location.reload();

// ---------------------------
// RENDER EDITABLE TABLE
// ---------------------------
function renderTable() {

  tbody.innerHTML = "";

  processes.forEach((p, i) => {
    tbody.innerHTML += `
      <tr>
        <td>${p.pid}</td>
        <td><input data-i="${i}" data-f="arrival" type="number" value="${p.arrival}"></td>
        <td><input data-i="${i}" data-f="burst" type="number" min="1" value="${p.burst}"></td>
        <td><input data-i="${i}" data-f="priority" type="number" value="${p.priority}"></td>
      </tr>
    `;
  });
}

// ---------------------------
// SAVE USER EDITS
// ---------------------------
function saveEdits() {
  document.querySelectorAll("#processBody input").forEach(inp => {
    const i = inp.dataset.i;
    const field = inp.dataset.f;
    const val = parseInt(inp.value);
    processes[i][field] = val;

    if (field === "burst") {
      processes[i].remaining = val;
    }
  });
}

// ---------------------------
// RESET STATS
// ---------------------------
function resetStats() {
  document.getElementById("avgWait").textContent = "Avg Waiting Time: —";
  document.getElementById("avgTurn").textContent = "Avg Turnaround Time: —";
}

// ---------------------------
// ROUND ROBIN
// ---------------------------
function buildRR() {
  timeline = [];
  idx = 0;
  playing = false;
  events.innerHTML = "";
  gantt.innerHTML = "";

  let arr = processes.map(p => ({ ...p }));
  arr.sort((a, b) => a.arrival - b.arrival);

  let t = 0;
  let i = 0;
  let q = [];

  while (i < arr.length || q.length > 0) {

    while (i < arr.length && arr[i].arrival <= t) {
      q.push(arr[i]);
      i++;
    }

    if (q.length === 0) {
      timeline.push({ pid: "IDLE", start: t, end: t + 1 });
      t++;
      continue;
    }

    const cur = q.shift();
    const run = Math.min(cur.remaining, quantum);

    timeline.push({
      pid: cur.pid,
      start: t,
      end: t + run
    });

    cur.remaining -= run;
    t += run;

    while (i < arr.length && arr[i].arrival <= t) {
      q.push(arr[i]);
      i++;
    }

    if (cur.remaining > 0) q.push(cur);
  }
}

// ---------------------------
// PREVIEW GANTT
// ---------------------------
function previewGantt() {
  gantt.innerHTML = "";
  timeline.forEach(seg => {
    const d = document.createElement("div");
    d.textContent = `${seg.pid} (${seg.start}-${seg.end})`;
    d.style.background = seg.pid === "IDLE" ? "#666" : "#3c59f0";
    gantt.appendChild(d);
  });
}

// ---------------------------
// PLAY
// ---------------------------
function play() {
  if (playing) return;
  playing = true;

  gantt.innerHTML = "";
  events.innerHTML = "";
  idx = 0;

  function animate() {
    if (!playing) return;

    if (idx < timeline.length) {
      draw(timeline[idx]);
      idx++;
      timer = setTimeout(animate, 600);
    } else {
      playing = false;
      stats();
    }
  }

  animate();
}

// ---------------------------
// PAUSE
// ---------------------------
function pause() {
  playing = false;
  clearTimeout(timer);
}

// ---------------------------
// STEP
// ---------------------------
function step() {
  pause();
  if (idx < timeline.length) {
    draw(timeline[idx]);
    idx++;
    if (idx === timeline.length) stats();
  }
}

// ---------------------------
// DRAW ONE SLICE
// ---------------------------
function draw(seg) {
  const d = document.createElement("div");
  d.textContent = `${seg.pid} (${seg.start}-${seg.end})`;
  d.style.background = seg.pid === "IDLE" ? "#666" : "#3c59f0";
  gantt.appendChild(d);

  const li = document.createElement("li");
  li.textContent = `${seg.pid} runs ${seg.start} → ${seg.end}`;
  events.appendChild(li);
}

// ---------------------------
// STATISTICS
// ---------------------------
function stats() {
  const data = {};

  processes.forEach(p => {
    const segs = timeline.filter(x => x.pid === p.pid);
    const completion = segs[segs.length - 1].end;
    const tat = completion - p.arrival;
    const wt = tat - p.burst;
    data[p.pid] = { tat, wt };
  });

  const avgWT = (
    Object.values(data).reduce((a, b) => a + b.wt, 0) / processes.length
  ).toFixed(2);

  const avgTAT = (
    Object.values(data).reduce((a, b) => a + b.tat, 0) / processes.length
  ).toFixed(2);

  document.getElementById("avgWait").textContent = "Avg Waiting Time: " + avgWT;
  document.getElementById("avgTurn").textContent = "Avg Turnaround Time: " + avgTAT;
}

}); // END DOMContentLoaded
