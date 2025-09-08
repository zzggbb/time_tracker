class ProjectCounter {
  constructor() {
    this.element = ELEMENT("div", {"class":"projects-count"}, this.count())
  }
  count() {
    let projects = STORAGE.get("projects")
    return Object.values(projects).length
  }
  update() {
    this.element.textContent = this.count()
  }
}

class Projects {
  initialize() {
    this.project_counter = new ProjectCounter()
    this.projects_list = ELEMENT("div", {"class": "projects-list"}, null,
      this.get_project_objects().map((p) => p.generate())
    )

    document.querySelector("body").appendChild(this.generate())
  }
  get_projects() {
    return STORAGE.get("projects")
  }
  set_projects(projects) {
    STORAGE.set("projects", projects)
  }
  get_project_objects() {
    let projects = STORAGE.get("projects")
    return Object.values(projects).map(Project.from_json)
  }
  new_project() {
    let project = new Project()
    // backend
    let projects = this.get_projects()
    projects[project.time_created] = project.to_json()
    this.set_projects(projects)
    // frontend
    this.projects_list.appendChild(project.generate())
    this.project_counter.update()
  }
  del_project(project_key) {
    // backend
    let projects = this.get_projects()
    delete projects[project_key]
    this.set_projects(projects)
    // frontend
    document.getElementById(project_key).remove()
    this.project_counter.update()
  }
  generate(){
    return ELEMENT("div", { "class": "projects-container" }, null, [
      ELEMENT("div", {"class": "projects-header"}, null, [
        this.project_counter.element,
        ELEMENT("div", {"class":"button add-button"}, "new project", null, () => {
          this.new_project()
        })
      ]),
      this.projects_list
    ])
  }
}
