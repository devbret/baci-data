const svg = d3.select("#chart");

let width = svg.node().clientWidth;
let height = svg.node().clientHeight;

const margin = { top: 40, right: 80, bottom: 60, left: 420 };
let innerW = width - margin.left - margin.right;
let innerH = height - margin.top - margin.bottom;

const g = svg
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const x = d3.scaleLinear().range([0, innerW]);
const y = d3.scaleBand().range([0, innerH]).padding(0.15);

const color = d3
  .scaleSequential()
  .interpolator(d3.interpolateRgbBasis(["#fbcfe8", "#fb7185", "#f59e0b"]));

const xAxisG = g.append("g").attr("class", "axis x-axis");
const yAxisG = g.append("g").attr("class", "axis y-axis");

const gridG = g.append("g").attr("class", "grid");
const barsG = g.append("g").attr("class", "bars");
const valuesG = g.append("g").attr("class", "values");

const watermark = g
  .append("text")
  .attr("class", "year-watermark")
  .attr("text-anchor", "end");

const tooltip = d3
  .select("body")
  .append("div")
  .attr("id", "tooltip")
  .style("position", "fixed")
  .style("pointer-events", "none")
  .style("opacity", 0)
  .style("background", "rgba(17, 24, 39, 0.92)")
  .style("color", "white")
  .style("padding", "10px 12px")
  .style("border-radius", "10px")
  .style("font-size", "12px")
  .style("line-height", "1.25")
  .style("box-shadow", "0 10px 30px rgba(0,0,0,0.25)");

const fmtUSD = d3.format(",.2f");
const fmt = (vKusd) => `${fmtUSD(vKusd)}k`;
const fmtInt = d3.format(",.0f");

const playBtn = document.getElementById("play");
const pauseBtn = document.getElementById("pause");
const yearSlider = document.getElementById("yearSlider");
const yearLabel = document.getElementById("yearLabel");
const topNInput = document.getElementById("topN");

let timer = null;
let state = {
  years: [],
  yearIndex: 0,
  yearToProducts: new Map(),
};

function hs6(k) {
  return String(k).padStart(6, "0");
}

function shortLabelFromText(full) {
  if (!full) return "";
  if (full.includes(":")) return full.split(":")[0].trim();
  return full.split(" ")[0].trim();
}

function productLabel(d) {
  return d?.name || d?.hs6 || (d?.k != null ? hs6(d.k) : "");
}

function getTopNForYear(year, topN) {
  const products = state.yearToProducts.get(year) ?? [];
  const sorted = products.slice().sort((a, b) => d3.descending(a.v, b.v));
  return sorted.slice(0, topN);
}

function wrapText(textSelection, widthPx) {
  textSelection.each(function () {
    const text = d3.select(this);
    const words = text.text().split(/\s+/).filter(Boolean);
    let line = [];
    let lineNumber = 0;
    const lineHeight = 1.1;
    const yAttr = text.attr("y");
    const dy = parseFloat(text.attr("dy") || 0);

    text.text(null);

    const xAttr = text.attr("x") ?? 0;

    let tspan = text
      .append("tspan")
      .attr("x", xAttr)
      .attr("y", yAttr)
      .attr("dy", `${dy}em`);

    for (let i = 0; i < words.length; i++) {
      line.push(words[i]);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > widthPx && line.length > 1) {
        line.pop();
        tspan.text(line.join(" "));
        line = [words[i]];
        tspan = text
          .append("tspan")
          .attr("x", xAttr)
          .attr("y", yAttr)
          .attr("dy", `${++lineNumber * lineHeight + dy}em`)
          .text(words[i]);
      }
    }
  });
}

function showTooltip(event, d) {
  const q = d.q != null && !Number.isNaN(d.q) ? `${fmtInt(d.q)} tons` : "n/a";
  tooltip.style("opacity", 1).html(
    `<div style="font-weight:700; font-size:13px; margin-bottom:6px;">
         ${d.name || "Unknown product"}
       </div>
       <div style="opacity:0.9;">HS6: <span style="font-weight:600">${d.hs6 || hs6(d.k)}</span></div>
       <div style="opacity:0.9;">Value: <span style="font-weight:600">${fmt(d.v)}</span> (thousand USD)</div>
       <div style="opacity:0.9;">Quantity: <span style="font-weight:600">${q}</span></div>`,
  );

  const pad = 14;
  const xPos = Math.min(window.innerWidth - 260, event.clientX + pad);
  const yPos = Math.min(window.innerHeight - 140, event.clientY + pad);
  tooltip.style("left", `${xPos}px`).style("top", `${yPos}px`);
}

function moveTooltip(event) {
  const pad = 14;
  const xPos = Math.min(window.innerWidth - 260, event.clientX + pad);
  const yPos = Math.min(window.innerHeight - 140, event.clientY + pad);
  tooltip.style("left", `${xPos}px`).style("top", `${yPos}px`);
}

function hideTooltip() {
  tooltip.style("opacity", 0);
}

function render(year) {
  const topN = Math.max(1, +topNInput.value || 30);
  const data = getTopNForYear(year, topN);

  const maxV = d3.max(data, (d) => d.v) ?? 0;
  x.domain([0, maxV * 1.06]);

  color.domain([0, maxV]);

  y.domain(data.map((d) => d.k));

  const labelByK = new Map(
    data.map((d) => [d.k, shortLabelFromText(productLabel(d)) || hs6(d.k)]),
  );

  xAxisG
    .attr("transform", `translate(0,${innerH})`)
    .transition()
    .duration(500)
    .call(
      d3
        .axisBottom(x)
        .ticks(8)
        .tickFormat((d) => `${d3.format(",.0f")(d)}k`),
    );

  yAxisG
    .transition()
    .duration(500)
    .call(
      d3.axisLeft(y).tickFormat((k) => {
        const kk = +k;
        return labelByK.get(kk) ?? hs6(kk);
      }),
    );

  yAxisG.selectAll(".tick text").call(wrapText, margin.left - 30);

  gridG
    .attr("transform", `translate(0,0)`)
    .transition()
    .duration(500)
    .call(
      d3
        .axisBottom(x)
        .ticks(8)
        .tickSize(innerH)
        .tickFormat(() => ""),
    );

  gridG.selectAll("line").attr("stroke", "rgba(0,0,0,0.08)");
  gridG.selectAll("path").attr("stroke", "none");

  watermark
    .attr("x", innerW - 10)
    .attr("y", innerH - 14)
    .text(year);

  const bars = barsG.selectAll("rect").data(data, (d) => d.k);

  bars
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", (d) => y(d.k))
    .attr("height", y.bandwidth())
    .attr("width", 0)
    .attr("rx", 8)
    .attr("ry", 8)
    .attr("fill", (d) => {
      const base = d3.color(color(d.v));
      base.opacity = 0.95;
      return base.formatRgb();
    })
    .attr("opacity", 0.95)
    .on("mouseenter", function (event, d) {
      d3.select(this)
        .interrupt()
        .transition()
        .duration(150)
        .attr("fill", "#ea580c")
        .attr("opacity", 1);

      showTooltip(event, d);
    })
    .on("mousemove", function (event) {
      moveTooltip(event);
    })
    .on("mouseleave", function (event, d) {
      d3.select(this)
        .interrupt()
        .transition()
        .duration(150)
        .attr("fill", color(d.v))
        .attr("opacity", 0.95);

      hideTooltip();
    })
    .transition()
    .duration(700)
    .attr("width", (d) => x(d.v));

  bars
    .transition()
    .duration(700)
    .attr("y", (d) => y(d.k))
    .attr("height", y.bandwidth())
    .attr("width", (d) => x(d.v))
    .attr("fill", (d) => {
      const base = d3.color(color(d.v));
      base.opacity = 0.95;
      return base.formatRgb();
    })
    .attr("opacity", 0.95);

  bars
    .exit()
    .transition()
    .duration(350)
    .attr("width", 0)
    .attr("opacity", 0)
    .remove();

  const values = valuesG.selectAll("text.value-label").data(data, (d) => d.k);

  values
    .enter()
    .append("text")
    .attr("class", "value-label")
    .attr("x", (d) => x(d.v) + 8)
    .attr("y", (d) => y(d.k) + y.bandwidth() / 2)
    .attr("text-anchor", "start")
    .attr("opacity", 0)
    .text((d) => fmt(d.v))
    .transition()
    .duration(500)
    .attr("opacity", 1);

  values
    .transition()
    .duration(700)
    .attr("x", (d) => x(d.v) + 8)
    .attr("y", (d) => y(d.k) + y.bandwidth() / 2)
    .text((d) => fmt(d.v))
    .attr("opacity", 0.95);

  values.exit().transition().duration(200).attr("opacity", 0).remove();

  yearLabel.textContent = String(year);
  yearSlider.value = String(state.yearIndex);
}

function setYearIndex(idx) {
  state.yearIndex = Math.max(0, Math.min(state.years.length - 1, idx));
  const year = state.years[state.yearIndex];
  render(year);
}

function startPlaying() {
  if (timer) return;
  playBtn.disabled = true;
  pauseBtn.disabled = false;

  timer = setInterval(() => {
    const next = state.yearIndex + 1;
    if (next >= state.years.length) {
      stopPlaying();
      return;
    }
    setYearIndex(next);
  }, 900);
}

function stopPlaying() {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
  playBtn.disabled = false;
  pauseBtn.disabled = true;
}

function resize() {
  width = svg.node().clientWidth;
  height = svg.node().clientHeight;

  innerW = width - margin.left - margin.right;
  innerH = height - margin.top - margin.bottom;

  x.range([0, innerW]);
  y.range([0, innerH]);

  xAxisG.attr("transform", `translate(0,${innerH})`);

  watermark.attr("x", innerW - 10).attr("y", innerH - 14);

  const year = state.years[state.yearIndex];
  if (year != null) render(year);
}

window.addEventListener("resize", () => {
  clearTimeout(window.__baciResizeTimer);
  window.__baciResizeTimer = setTimeout(resize, 120);
});

yearSlider.addEventListener("input", (e) => {
  stopPlaying();
  setYearIndex(+e.target.value);
});

topNInput.addEventListener("change", () => {
  const year = state.years[state.yearIndex];
  render(year);
});

playBtn.addEventListener("click", startPlaying);
pauseBtn.addEventListener("click", stopPlaying);

(async function init() {
  const json = await d3.json("./out/product_space_timeseries.json");

  state.years = json.years;
  state.yearToProducts = new Map(json.data.map((d) => [d.year, d.products]));

  yearSlider.min = 0;
  yearSlider.max = state.years.length - 1;
  yearSlider.value = 0;

  xAxisG.attr("transform", `translate(0,${innerH})`);

  setYearIndex(0);
})();
