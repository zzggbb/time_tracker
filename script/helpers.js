"use strict";

function set_text(element, text) {
  if (element)
    element.textContent = text
}

function ELEMENT(tag, attributes, text_content=null, children=null,
                 onmouseup=null, oninput=null) {
  let e = document.createElement(tag)
  for (let [k, v] of Object.entries(attributes))
    e.setAttribute(k, v)

  if (text_content !== null)
    if (tag === "input")
      e.value = text_content
    else
      e.textContent = text_content

  if (children !== null) for (let child of children) e.appendChild(child)

  if (onmouseup !== null) e.onmouseup = onmouseup

  if (oninput !== null) e.oninput = oninput

  return e
}

function DIV(attributes, text_content=null, children=null, onclick=null) {
  return ELEMENT("div", attributes, text_content, children, onclick)
}

function format_timestamp(time_ms) {
  if (time_ms === null)
    return ["never"]

  let date = new Date(time_ms)
  let calendar_part = date.toLocaleString("en-US", {
    weekday: "short", month: "short", day: "2-digit", year: "numeric"
  }).replaceAll(",", "")
  let time_part = date.toLocaleString("en-US", {
    timeStyle: "long",
  })
  return [calendar_part, time_part]
}

function format_duration(time_ms, separator=":", enable_ms=false) {
  if (time_ms === null) return "none"

  const unit_names = ["h", "m", "s", "ms"]
  const unit_divisors = [1, 60, 60, 1000]
  const unit_paddings = [3, 2, 2, 3]
  const N = unit_names.length

  let t = time_ms
  let divisor = unit_divisors.reduce((acc, x) => acc*x)
  let output_map = {}
  for (let i=0; i<N; i++) {
    let unit_name = unit_names[i], unit_divisor = unit_divisors[i]
    divisor /= unit_divisor
    let unit_value = Math.floor(t / divisor)
    t = t - unit_value*divisor
    output_map[unit_name] = unit_value
  }
  if (!enable_ms) delete output_map["ms"]

  let output = []
  let entries = Object.entries(output_map)
  for (let j=0; j<entries.length; j++) {
    let [n, v] = entries[j]
    output.push(String(v).padStart(unit_paddings[j], '0'))
  }
  return output.join(separator)
}
