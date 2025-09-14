"use strict";

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
  get projects() {
    return STORAGE.get("projects")
  }
  set projects(v) {
    STORAGE.set("projects", v)
  }
  get_project_objects() {
    //let projects = this.get_projects()
    return Object.values(this.projects).map(Project.from_json)
  }
  get_project(project_key) {
    //return this.get_projects()[project_key]
    return this.projects[project_key]
  }
  new_project() {
    let project = new Project()
    this.projects_list.appendChild(project.generate())
    this.project_counter.update()
  }
  del_project(project_key) {
    // backend
    //let projects = this.get_projects()
    let projects = this.projects
    delete projects[project_key]
    //this.set_projects(projects)
    this.projects = projects
    // frontend
    document.getElementById(project_key).remove()
    this.project_counter.update()
  }
  generate(){
    return DIV({ "class": "projects-container" }, null, [
      DIV({"class": "projects-header"}, null, [
        this.project_counter.element,
        DIV({"class":"button add-button"}, "new", null, this.new_project.bind(this))
      ]),
      this.projects_list
    ])
  }
}
