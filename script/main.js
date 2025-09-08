const STORAGE = new Storage({
  "projects": {}
})

const PROJECTS = new Projects()

window.onload = () => {
  console.log("document loaded")
  PROJECTS.initialize()
}
