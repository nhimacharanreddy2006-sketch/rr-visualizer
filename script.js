let processes = [];
let timeline = [];
let quantum = 4;

let currentIndex = 0;
let playing = false;
let timer;

const ptable = document.getElementById("processBody");
const gantt = document.getElementById("gantt");
const events = document.getElementById("events");

/* ------------------------------------------------------
   1. ADD PROCESS (Editable Table)
---------------------------------------------------------*/
document.getElementById("addProcess").addEventListener("click", () => {
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
});

/* ------------------------------------------------------
   2. CLEAR EVERYTHING
---------------------------------------------------------*/
document.getElementById("clear").addEventListener("click", () => {
  processes = [];
  timeline = [];
  currentIndex = 0;

  ptable.innerHTML = "";
  gantt.innerHTML = "";
  events.innerHTML = "";
  resetStats();
});

/* ------------------------------------------------------
   3. BUILD SCHEDULE + PREVIEW GANTT
---------------------------------------------------------*/
document.getElementById("build").addEventListener("click", () => {
  saveTableEdits();           // very important!
  quantum = parseInt(document.getElementById("quantum").value);

  buildSchedule();
  previewGantt();             // show static Gantt chart
});

/* ------------------------------------------------------
   PLAY / PAUSE / STEP / RESET
---------------------------------------------------------*/
document.getElementById("play").addEventListener("click", () => playAnimation());
document.getElementById("pause").addEventListener("click", () => { playing = false; clearTimeout(timer); });
document.getElementById("step").addEventListener("click", () => { playing = false; clearTimeout(timer); stepOnce(); });
document.getElementById("reset").addEventListener("click", () => location.reload());


/* ------------------------------------------------------
   RENDER EDITABLE TABLE
---------------------------------------------------------*/
function renderEditableTable() {
  ptable.innerHTML = "";

  processes.forEach((p, index) => {
    ptable.innerHTML += `
      <tr>
        <td>${p.pid}</td>
        <td><input type="number" min="0" value="${p.arrival}" data-index="${index}" data-field="arrival"></td>
        <td><input type="number" min="1" value="${p.burst}" data-index="${index}" data-field="burst"></td>
        <td><input type="number" min="1" max="10" value="${p.priority}" data-index="${index}" data-field="priority"></td>
      </tr>
    `;
  });
}

/* ------------------------------------------------------
   SAVE EDITED VALUES BACK TO ARRAY
---------------------------------------------------------*/
function saveTableEdits() {
  const inputs = document.querySelectorAll("#processBody input");
  inputs.forEach(inp => {
    const i = inp.dataset.index;
    const field = inp.dataset.field;
    processes[i][field] = parseInt(inp.value);

    if (field === "burst") processes[i].remaining = parseInt(inp.value);
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
   4. BUILD ROUND ROBIN TIMELINE (NO UI)
---------------------------------------------------------*/
function buildSchedule() {
  timeline = [];
  events.innerHTML = "";
  gantt.innerHTML = "";
  currentIndex = 0;
  playing = false;

  const ready = [...processes].map(p => ({ ...p }));
  ready.sort((a, b) => a.arrival - b.arrival);

  let time = 0;
  let i = 0;
  const queue = [];

  while (i < ready.length || queue.length > 0) {
    while (i < ready.length && ready[i].arrival <= time)
      queue.push(ready[i++]);

    if (queue.length === 0) {
      timeline.push({ pid: "IDLE", start: time, end: time + 1 });
      time++;
      continue;
    }

    const cur = queue.shift();
    const runTime = Math.min(cur.remaining, quantum);

    timeline.push({
      pid: cur.pid,
      start: time,
      end: time + runTime
    });

    cur.remaining -= runTime;
    time += runTime;

    while (i < ready.length && ready[i].arrival <= time)
      queue.push(ready[i]);

    if (cur.remaining > 0) queue.push(cur);
  }
}

/* ------------------------------------------------------
   5. PREVIEW (static gantt chart)
---------------------------------------------------------*/
function previewGantt() {
  gantt.innerHTML = "";

  timeline.forEach(seg => {
    const div = document.createElement("div");
    div.textContent = `${seg.pid} (${seg.start}-${seg.end})`;
    div.style.backgroundColor = seg.pid === "IDLE" ? "#666" : "#3c59f0";
    gantt.appendChild(div);
  });
}

/* ------------------------------------------------------
   6. PLAY ANIMATION
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

/* ------------------------------------------------------
   7. SINGLE STEP
---------------------------------------------------------*/
function stepOnce() {
  if (currentIndex < timeline.length) {
    drawSlice(timeline[currentIndex]);
    currentIndex++;

    if (currentIndex === timeline.length) displayStats();
  }
}

/* ------------------------------------------------------
   8. DRAW ONE GANTT SEGMENT
---------------------------------------------------------*/
function drawSlice(seg) {
  const div = document.createElement("div");
  div.textContent = `${seg.pid} (${seg.start}-${seg.end})`;
  div.style.backgroundColor = seg.pid === "IDLE" ? "#666" : "#3c59f0";
  gantt.appendChild(div);

  const li = document.createElement("li");
  li.textContent = `${seg.pid} runs from ${seg.start} to ${seg.end}`;
  events.appendChild(li);
}

/* ------------------------------------------------------
   9. FINAL STATISTICS
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
