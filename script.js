let processes = [];
let timeline = [];
let quantum = 4;

let currentIndex = 0;
let playing = false;
let timer;

const ptable = document.getElementById("processBody");
const gantt = document.getElementById("gantt");
const events = document.getElementById("events");

document.getElementById("addProcess").addEventListener("click", () => {
  const pid = "P" + (processes.length + 1);
  const arrival = Math.floor(Math.random() * 10);
  const burst = Math.floor(Math.random() * 10) + 1;
  const priority = Math.floor(Math.random() * 5) + 1;

  processes.push({ pid, arrival, burst, priority, remaining: burst });
  renderTable();
});

document.getElementById("clear").addEventListener("click", () => {
  processes = [];
  timeline = [];
  renderTable();
  gantt.innerHTML = "";
  events.innerHTML = "";
  resetStats();
});

document.getElementById("build").addEventListener("click", () => {
  quantum = parseInt(document.getElementById("quantum").value);
  buildSchedule(); // Only compute
});

document.getElementById("play").addEventListener("click", () => {
  playAnimation();
});

document.getElementById("pause").addEventListener("click", () => {
  playing = false;
  clearTimeout(timer);
});

document.getElementById("step").addEventListener("click", () => {
  playing = false;
  clearTimeout(timer);
  stepOnce();
});

document.getElementById("reset").addEventListener("click", () => location.reload());

function renderTable() {
  ptable.innerHTML = "";
  processes.forEach(p => {
    ptable.innerHTML += `<tr>
      <td>${p.pid}</td>
      <td>${p.arrival}</td>
      <td>${p.burst}</td>
      <td>${p.priority}</td>
    </tr>`;
  });
}

function resetStats() {
  document.getElementById("avgWait").textContent = "Avg Waiting Time: —";
  document.getElementById("avgTurn").textContent = "Avg Turnaround Time: —";
}

// ----------------------------------------------------
// 1️⃣ BUILD SCHEDULE (NO UI OUTPUT)
// ----------------------------------------------------
function buildSchedule() {
  if (processes.length === 0) return;

  // Reset for new build
  timeline = [];
  events.innerHTML = "";
  gantt.innerHTML = "";
  resetStats();
  currentIndex = 0;
  playing = false;

  const sorted = [...processes].map(p => ({...p})).sort((a, b) => a.arrival - b.arrival);

  let time = 0;
  let i = 0;
  const queue = [];

  while (i < sorted.length || queue.length > 0) {
    while (i < sorted.length && sorted[i].arrival <= time)
      queue.push(sorted[i++]);

    if (queue.length === 0) {
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

    while (i < sorted.length && sorted[i].arrival <= time)
      queue.push(sorted[i]);

    if (cur.remaining > 0) queue.push(cur);
  }

  console.log("Schedule built:", timeline);
}

// ----------------------------------------------------
// 2️⃣ ANIMATION PLAY
// ----------------------------------------------------
function playAnimation() {
  if (playing) return;
  playing = true;

  function animate() {
    if (!playing) return;

    if (currentIndex < timeline.length) {
      drawSlice(timeline[currentIndex]);
      currentIndex++;

      timer = setTimeout(animate, 800); // Animation speed
    } else {
      playing = false;
      displayStats();
    }
  }

  animate();
}

// ----------------------------------------------------
// 3️⃣ STEP EXECUTION (manual)
// ----------------------------------------------------
function stepOnce() {
  if (currentIndex < timeline.length) {
    drawSlice(timeline[currentIndex]);
    currentIndex++;

    if (currentIndex === timeline.length) {
      displayStats();
    }
  }
}

// ----------------------------------------------------
// 4️⃣ DRAW ONE BLOCK IN GANTT
// ----------------------------------------------------
function drawSlice(seg) {
  const div = document.createElement("div");
  div.textContent = `${seg.pid} (${seg.start}-${seg.end})`;
  gantt.appendChild(div);

  const li = document.createElement("li");
  li.textContent = `${seg.pid} runs from ${seg.start} to ${seg.end}`;
  events.appendChild(li);
}

// ----------------------------------------------------
// 5️⃣ FINAL STATISTICS (only after animation)
// ----------------------------------------------------
function displayStats() {
  const stats = {};
  processes.forEach(p => {
    const last = timeline.filter(x => x.pid === p.pid).slice(-1)[0];
    const completion = last.end;
    const tat = completion - p.arrival;
    const wt = tat - p.burst;
    stats[p.pid] = { tat, wt };
  });

  const avgWT = (Object.values(stats).reduce((a, b) => a + b.wt, 0) / processes.length).toFixed(2);
  const avgTAT = (Object.values(stats).reduce((a, b) => a + b.tat, 0) / processes.length).toFixed(2);

  document.getElementById("avgWait").textContent = `Avg Waiting Time: ${avgWT}`;
  document.getElementById("avgTurn").textContent = `Avg Turnaround Time: ${avgTAT}`;
}
