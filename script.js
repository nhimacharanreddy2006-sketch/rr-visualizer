let processes = [];
let timeline = [];
let isRunning = false;
let quantum = 4;
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
});

document.getElementById("build").addEventListener("click", () => {
  quantum = parseInt(document.getElementById("quantum").value);
  runRR();
});

document.getElementById("reset").addEventListener("click", () => {
  location.reload();
});

function renderTable() {
  ptable.innerHTML = "";
  processes.forEach(p => {
    ptable.innerHTML += `<tr><td>${p.pid}</td><td>${p.arrival}</td><td>${p.burst}</td><td>${p.priority}</td></tr>`;
  });
}

function runRR() {
  if (processes.length === 0) return;
  let time = 0;
  const queue = [];
  const sorted = [...processes].sort((a, b) => a.arrival - b.arrival);
  let i = 0;

  while (i < sorted.length || queue.length > 0) {
    while (i < sorted.length && sorted[i].arrival <= time) queue.push(sorted[i++]);

    if (queue.length === 0) {
      time++;
      continue;
    }

    const cur = queue.shift();
    const runTime = Math.min(cur.remaining, quantum);
    timeline.push({ pid: cur.pid, start: time, end: time + runTime });
    cur.remaining -= runTime;
    time += runTime;

    events.innerHTML += `<li>${cur.pid} runs from ${time - runTime} to ${time}</li>`;

    while (i < sorted.length && sorted[i].arrival <= time) queue.push(sorted[i++]);
    if (cur.remaining > 0) queue.push(cur);
  }

  displayGantt();
  displayStats();
}

function displayGantt() {
  gantt.innerHTML = "";
  timeline.forEach(seg => {
    const div = document.createElement("div");
    div.textContent = `${seg.pid} (${seg.start}-${seg.end})`;
    gantt.appendChild(div);
  });
}

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
