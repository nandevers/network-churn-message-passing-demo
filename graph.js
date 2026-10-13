(() => {
  "use strict";

  const svgNS = "http://www.w3.org/2000/svg";
  const nodes = [
    { id: "A", x: 116, y: 112, role: "core", base: .06 },
    { id: "B", x: 285, y: 69, role: "periphery", base: .04 },
    { id: "C", x: 300, y: 181, role: "bridge", base: .07 },
    { id: "D", x: 430, y: 126, role: "core", base: .05 },
    { id: "E", x: 73, y: 259, role: "periphery", base: .04 },
    { id: "F", x: 203, y: 284, role: "bridge", base: .08 },
    { id: "G", x: 441, y: 252, role: "core", base: .06 },
    { id: "H", x: 595, y: 182, role: "periphery", base: .05 },
    { id: "I", x: 333, y: 378, role: "bridge", base: .07 },
    { id: "J", x: 576, y: 339, role: "core", base: .04 },
    { id: "K", x: 715, y: 397, role: "periphery", base: .06 },
    { id: "L", x: 685, y: 85, role: "periphery", base: .05 }
  ];
  const ties = [
    ["A","B",.82],["A","C",.76],["A","D",.69],["A","E",.61],["A","F",.36],
    ["B","F",.52],["C","D",.72],["C","G",.53],["D","G",.74],["D","H",.42],
    ["E","H",.66],["F","I",.78],["G","I",.64],["G","J",.46],["H","J",.71],
    ["I","K",.75],["J","L",.58],["K","L",.62]
  ];

  const edgeLayer = document.getElementById("edges");
  const packetLayer = document.getElementById("packets");
  const nodeLayer = document.getElementById("nodes");
  const seedSelect = document.getElementById("seed-select");
  const strengthInput = document.getElementById("strength");
  const strengthValue = document.getElementById("strength-value");
  const roundLabel = document.getElementById("round-label");
  const playButton = document.getElementById("play-button");
  const stepButton = document.getElementById("step-button");
  const resetButton = document.getElementById("reset-button");
  const mostExposed = document.getElementById("most-exposed");
  const exposureBar = document.getElementById("exposure-bar");
  const exposureCaption = document.getElementById("exposure-caption");

  let probabilities = new Map();
  let round = 0;
  let timer = null;

  function el(tag, attrs = {}) {
    const item = document.createElementNS(svgNS, tag);
    for (const [key, value] of Object.entries(attrs)) item.setAttribute(key, String(value));
    return item;
  }
  function seedId() { return seedSelect.value; }
  function messageStrength() { return Number(strengthInput.value); }
  function member(id) { return nodes.find(n => n.id === id); }

  function drawNetwork() {
    edgeLayer.replaceChildren();
    nodeLayer.replaceChildren();
    for (const [from, to, weight] of ties) {
      const a = member(from), b = member(to);
      const line = el("line", {
        x1:a.x, y1:a.y, x2:b.x, y2:b.y,
        class: weight >= .68 ? "edge strong" : "edge",
        "data-from":from, "data-to":to, "data-weight":weight
      });
      const title = el("title");
      title.textContent = "Tie strength " + weight.toFixed(2) + " between members " + from + " and " + to;
      line.append(title);
      edgeLayer.append(line);
    }
    for (const node of nodes) {
      const group = el("g", { class:"member", transform:"translate(" + node.x + " " + node.y + ")", tabindex:"0", role:"button", "data-node":node.id });
      const title = el("title");
      title.textContent = "Synthetic member " + node.id + ", " + node.role + " position";
      group.append(title);
      group.append(el("circle", { class:"node-halo", r:25 }));
      group.append(el("circle", { class:"node-circle node-core", r:16 }));
      const label = el("text", { class:"node-label", y:1 });
      label.textContent = node.id;
      group.append(label);
      const caption = el("text", { class:"node-caption", y:31 });
      caption.textContent = node.role.toUpperCase();
      group.append(caption);
      group.addEventListener("click", () => selectSeed(node.id));
      group.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectSeed(node.id);
        }
      });
      nodeLayer.append(group);
    }
    render();
  }

  function selectSeed(id) {
    stopPlayback();
    seedSelect.value = id;
    resetSimulation();
  }

  function resetSimulation() {
    stopPlayback();
    round = 0;
    probabilities = new Map(nodes.map(n => [n.id, n.id === seedId() ? .92 : n.base]));
    packetLayer.replaceChildren();
    edgeLayer.querySelectorAll(".edge").forEach(line => line.classList.remove("active"));
    roundLabel.textContent = "ROUND 0";
    exposureCaption.textContent = "Choose Play or Step to begin.";
    exposureBar.style.width = "0%";
    mostExposed.textContent = "—";
    playButton.textContent = "▶  Play";
    render();
  }

  function nextProbabilities(current) {
    const beta = messageStrength();
    const updated = new Map();
    for (const target of nodes) {
      if (target.id === seedId()) {
        updated.set(target.id, Math.max(.88, current.get(target.id)));
        continue;
      }
      let survival = 1 - target.base;
      for (const [from, to, weight] of ties) {
        let sourceId = null;
        if (to === target.id) sourceId = from;
        else if (from === target.id) sourceId = to;
        if (sourceId !== null) {
          const message = Math.min(.95, beta * weight * current.get(sourceId));
          survival *= (1 - message);
        }
      }
      updated.set(target.id, Math.min(.97, 1 - survival));
    }
    return updated;
  }

  function sendPacket(from, to, weight) {
    const a = member(from), b = member(to);
    const packet = el("circle", { class:"packet", r:4, cx:a.x, cy:a.y, "aria-hidden":"true" });
    packetLayer.append(packet);
    const started = performance.now();
    const duration = 470 + (1 - weight) * 260;
    function animate(now) {
      const t = Math.min(1, (now - started) / duration);
      const eased = t * t * (3 - 2 * t);
      packet.setAttribute("cx", a.x + (b.x - a.x) * eased);
      packet.setAttribute("cy", a.y + (b.y - a.y) * eased);
      if (t < 1) requestAnimationFrame(animate);
      else packet.remove();
    }
    requestAnimationFrame(animate);
  }

  function stepOnce() {
    const previous = new Map(probabilities);
    const updated = nextProbabilities(previous);
    for (const [a,b,w] of ties) {
      if (previous.get(a) > .13 && updated.get(b) - previous.get(b) > .012) sendPacket(a,b,w);
      if (previous.get(b) > .13 && updated.get(a) - previous.get(a) > .012) sendPacket(b,a,w);
    }
    probabilities = updated;
    round += 1;
    roundLabel.textContent = "ROUND " + round;
    exposureCaption.textContent = "Synthetic risk signal after " + round + (round === 1 ? " round." : " rounds.");
    render();
  }

  function render() {
    const seed = seedId();
    nodeLayer.querySelectorAll(".member").forEach(group => {
      const id = group.getAttribute("data-node");
      const value = probabilities.get(id) ?? member(id).base;
      const circle = group.querySelector(".node-circle");
      circle.setAttribute("class", "node-circle " + (id === seed ? "node-seed" : value >= .35 ? "node-high" : value >= .15 ? "node-medium" : "node-low"));
      group.querySelector(".node-halo").setAttribute("stroke", id === seed ? "#c4f36b65" : "transparent");
      group.setAttribute("aria-label", "Synthetic member " + id + ", " + member(id).role + ", illustrative risk signal " + Math.round(value * 100) + " percent. Select as initial signal.");
      const title = group.querySelector("title");
      title.textContent = "Synthetic member " + id + " · " + member(id).role + " · illustrative signal " + Math.round(value * 100) + "%";
    });
    const edgeActive = new Set();
    for (const [a,b,w] of ties) {
      if (probabilities.get(a) > .13 || probabilities.get(b) > .13) edgeActive.add(a + "|" + b);
    }
    edgeLayer.querySelectorAll(".edge").forEach(line => {
      const a = line.getAttribute("data-from"), b = line.getAttribute("data-to");
      line.classList.toggle("active", edgeActive.has(a + "|" + b));
    });
    const candidates = nodes.filter(n => n.id !== seed).sort((a,b) => probabilities.get(b.id) - probabilities.get(a.id));
    const top = candidates[0];
    const value = Math.round(probabilities.get(top.id) * 100);
    mostExposed.textContent = "Member " + top.id + " · " + value + "%";
    exposureBar.style.width = Math.min(100,value) + "%";
  }

  function stopPlayback() {
    if (timer !== null) window.clearInterval(timer);
    timer = null;
    playButton.textContent = "▶  Play";
    playButton.setAttribute("aria-pressed","false");
  }
  function togglePlayback() {
    if (timer !== null) return stopPlayback();
    playButton.textContent = "Ⅱ  Pause";
    playButton.setAttribute("aria-pressed","true");
    timer = window.setInterval(() => {
      if (round >= 8) stopPlayback();
      else stepOnce();
    }, 1450);
  }

  seedSelect.addEventListener("change", resetSimulation);
  strengthInput.addEventListener("input", () => {
    strengthValue.value = Number(strengthInput.value).toFixed(2);
    strengthValue.textContent = Number(strengthInput.value).toFixed(2);
    resetSimulation();
  });
  playButton.addEventListener("click", togglePlayback);
  stepButton.addEventListener("click", () => { stopPlayback(); stepOnce(); });
  resetButton.addEventListener("click", resetSimulation);

  strengthValue.value = Number(strengthInput.value).toFixed(2);
  strengthValue.textContent = Number(strengthInput.value).toFixed(2);
  drawNetwork();
  resetSimulation();
})();