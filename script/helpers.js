function ELEMENT(tag, attributes, text_content=null, children=null, onclick=null) {
  let e = document.createElement(tag)
  for (let [k, v] of Object.entries(attributes))
    e.setAttribute(k, v)

  if (text_content !== null)
    if (tag === "input")
      e.value = text_content
    else
      e.textContent = text_content

  if (children !== null)
    for (let child of children)
      e.appendChild(child)

  if (onclick !== null)
    e.onclick = onclick

  return e
}
