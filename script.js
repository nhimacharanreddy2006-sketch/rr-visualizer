/* ------------------------------------------------------
   GLOBAL VARIABLES
---------------------------------------------------------*/
let processes = [];
let timeline = [];
let quantum = 4;

let currentIndex = 0;
let playing = false;
let timer;

/* ------------------------------------------------------
   DOM ELEMENTS (SAFE)
---------------------------------------------------------*/
const ptable = document.getElementById("processBody");
const gantt = document.getElementById("gantt");
const events = document.getElementById("events");

/* ------------------------------------------------------
   1. ADD PROCESS (Editable)
---------------------------------------------------------*/
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

  renderEditableTable();
};

/* ------------------------------------------------------
   2. CLEAR
---------------------------------------------------------*/
document.getElementById("clear").onclick = () => {
  processes = [];
  timeline = [];
  currentIndex = 0;
  playing = false;

  ptable.innerHTML = "";
  gantt.innerHTML = "";
  events.innerHTML = "";
  resetStats();
};

/* ------------------------------------------------------
   3. BUILD SCHEDULE
---------------------------------------------------------*/
document.getElementById("build").onclick = () => {
  saveTableEdits();
  quantum = parseInt(document.getElementById("quantum").value);

  if (processes.length === 0) return;

  buildSchedule();
  previewGantt();
};

/* ------------------------------------------------------
   4. PLAY / PAUSE / STEP / RESET
---------------------------------------------------------*/
document.getElementById("play").onclick = () => playAnimation();
document.getElementById("pause").onclick = () => stopAnimation();
document.getElementById("step").onclick = () => stepOnce();
document.getElementById("reset").onclick = () => location.reload();

/* ------------------------------------------------------
   RENDER EDITABLE TABLE
---------------------------------------------------------*/
function renderEditableTable() {
  ptable.innerHTML = "";

  processes.forEach((p, index) => {
    ptable.innerHTML += `
      <tr>
        <td>${p.pid}</td>
        <td><input type="number" min="0" value="${p.arrival}" data-i="${index}" data-f="arrival"></td>
        <td><input type="number" min="1" value="${p.burst}" data-i="${index}" data-f="burst"></td>
        <td><input type="number" min="1" value="${p.priority}" data-i="${index}" data-f="priority"></td>
      </tr>`;
  });
}

/* ------------------------------------------------------
   SAVE TABLE INPUTS
---------------------------------------------------------*/
function saveTableEdits() {
  const cells = document.querySelectorAll("#processBody input");

  cells.forEach(inp => {
    const i = inp.dataset.i;
    const field = inp.dataset.f;
    const val = parseInt(inp.value);

    processes[i][field] = val;

    if (field === "burst") processes[i].remaining = val;
  });
}

/* ------------------------------------------------------
   RESET STATS
---------------------------------------------------------*/
function resetStats() {
  document.getElementById("avgWait").textContent = "Avg Waiting Time: —";
  document.getElementById("avgTurn").textContent = "Avg Turnaround Time: —";
}

/* ------------------------------------------------------
   ROUND ROBIN SCHEDULING
---------------------------------------------------------*/
function buildSchedule() {
  timeline = [];
  events.innerHTML = "";
  gantt.innerHTML = "";
  playing = false;
  currentIndex = 0;

  const sorted = processes.map(p => ({ ...p }));
  sorted.sort((a, b) => a.arrival - b.arrival);

  let time = 0;
  let i = 0;
  let queue = [];

  while (i < sorted.length || queue.length > 0) {
    while (i < sorted.length && sorted[i].arrival <= time)
      queue.push(sorted[i++]);

    if (queue.length === 0) {
      timeline.push({ pid: "IDLE", start: time, end: time + 1 });
      time++;
      continue;
    }

    const cur = queue.shift();
    const run = Math.min(cur.remaining, quantum);

    timeline.push({
      pid: cur.pid,
      start: time,
      end: time + run
    });

    cur.remaining -= run;
    time += run;

    while (i < sorted.length && sorted[i].arrival <= time)
      queue.push(sorted[i]);

    if (cur.remaining > 0) queue.push(cur);
  }
}

/* ------------------------------------------------------
   PREVIEW STATIC GANTT
---------------------------------------------------------*/
function previewGantt() {
  gantt.innerHTML = "";

  timeline.forEach(seg => {
    const d = document.createElement("div");
    d.textContent = `${seg.pid} (${seg.start}-${seg.end})`;
    d.style.background = seg.pid === "IDLE" ? "#555" : "#3c59f0";
    gantt.appendChild(d);
  });
}

/* ------------------------------------------------------
   PLAY ANIMATION
---------------------------------------------------------*/
function playAnimation() {
  if (playing) return;
  playing = true;

  gantt.innerHTML = "";
  events.innerHTML = "";
  currentIndex = 0;

  function animate() {
    if (!playing) return;

    if (currentIndex < timeline.length) {
      drawSlice(timeline[currentIndex]);
      currentIndex++;
      timer = setTimeout(animate, 800);
    } else {
      playing = false;
      displayStats();
    }
  }

  animate();
}

function stopAnimation() {
  playing = false;
  clearTimeout(timer);
}

/* ------------------------------------------------------
   STEP ONCE
---------------------------------------------------------*/
function stepOnce() {
  stopAnimation();

  if (currentIndex < timeline.length) {
    drawSlice(timeline[currentIndex]);
    currentIndex++;

    if (currentIndex === timeline.length) displayStats();
  }
}

/* ------------------------------------------------------
   DRAW ONE SEGMENT
---------------------------------------------------------*/
function drawSlice(seg) {
  const d = document.createElement("div");
  d.textContent = `${seg.pid} (${seg.start}-${seg.end})`;
  d.style.background = seg.pid === "IDLE" ? "#555" : "#3c59f0";
  gantt.appendChild(d);

  const li = document.createElement("li");
  li.textContent = `${seg.pid} runs from ${seg.start} to ${seg.end}`;
  events.appendChild(li);
}

/* ------------------------------------------------------
   CALCULATE STATS
---------------------------------------------------------*/
function displayStats() {
  const stats = {};

  processes.forEach(p => {
    const segs = timeline.filter(x => x.pid === p.pid);
    const completion = segs[segs.length - 1].end;
    const tat = completion - p.arrival;
    const wt = tat - p.burst;
    stats[p.pid] = { tat, wt };
  });

  const avgWT = (Object.values(stats).reduce((a, b) => a + b.wt, 0) / processes.length).toFixed(2);
  const avgTAT = (Object.values(stats).reduce((a, b) => a + b.tat, 0) / processes.length).toFixed(2);

  document.getElementById("avgWait").textContent = `Avg Waiting Time: ${avgWT}`;
  document.getElementById("avgTurn").textContent = `Avg Turnaround Time: ${avgTAT}`;
}
