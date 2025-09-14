"use strict";

const STORAGE = new Storage({
  "projects": {}
})
const PROJECTS = new Projects()
window.onload = () => {
  PROJECTS.initialize()
}
