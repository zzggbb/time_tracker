"use strict";

class SessionCount {
  constructor(project_key, count) {
    this.project_key = project_key
    this.element = DIV({"class":"session-count"}, count)
  }
  count() {
    return PROJECTS.get_project(this.project_key).session_count
  }
  add(x) {
    let projects = PROJECTS.projects
    let old_count = projects[this.project_key].session_count ?? 0
    let new_count = old_count + x
    projects[this.project_key].session_count = new_count
    PROJECTS.projects = projects

    this.element.textContent = new_count
  }
  inc() { this.add(1) }
  dec() { this.add(-1)}
  reset() { this.add(-this.count()) }
}

class Project {
  static from_json(o) {
    // Used to reconstruct a project from storage
    return new Project(o.name, o.time_created,
                       o.time_saved, o.time_last_start, o.duration_last_session,
                       o.running, o.session_count)
  }
  static generate_timestamp_element(timestamp) {
    return DIV({"class":"timestamp"}, null,
      format_timestamp(timestamp).map((text) => {
        return DIV({"class":"timestamp-section"}, text)
      })
    )
  }
  constructor(name=null, time_created=null,
              time_saved=0, time_last_start=null, duration_last_session=null,
              running=false, session_count=0) {

    if (time_created === null) {
      // Project doesn't exist in storage yet
      this.time_created = Date.now()
      let projects = PROJECTS.projects
      projects[this.time_created] = {time_created: this.time_created}
      PROJECTS.projects = projects
    } else {
      // Project already exists in storage
      this.time_created = time_created
    }

    this.name = name
    this.time_saved = time_saved
    this.time_last_start = time_last_start
    this.duration_last_session = duration_last_session
    this.running = running
    this.session_count = new SessionCount(this.time_created, session_count)

    this.time_created_element = Project.generate_timestamp_element(this.time_created)
    this.time_last_start_element = Project.generate_timestamp_element(this.time_last_start)
    this.duration_total_element = DIV({"class":"time duration-total"},
      format_duration(this.get_duration_total())
    )
    this.duration_curr_session_element = DIV({"class":"time duration-curr-session"},
      format_duration(this.get_session_time())
    )
    this.duration_last_session_element = DIV({"class":"time duration-last-session"},
      format_duration(this.duration_last_session)
    )
    this.session_toggle_element = DIV(
      {"class": "button toggle-button", "running": this.running},
      null, null, this.session_toggle.bind(this)
    )
    this.session_cancel_element = DIV(
      {"class": "button cancel-button","running": this.running},
      "cancel session", null, this.session_cancel.bind(this)
    )
    this.project_reset_element = DIV(
      {"class":"button reset-button"},
      "reset", null, this.project_reset.bind(this)
    )

    this.interval_id = window.setInterval(() => {
      if (!this.running) return
      this.update_running_durations()
    }, 10)
  }

  /* backend helpers */
  get_backend(key) {
    return PROJECTS.get_project(this.time_created)[key]
  }
  set_backend(key, value) {
    let projects = PROJECTS.projects
    let project = projects[this.time_created]
    project[key] = value
    PROJECTS.projects = projects
  }

  /* frontend helpers */
  update_running_durations() {
    set_text(this.duration_total_element, format_duration(this.get_duration_total()))
    set_text(this.duration_curr_session_element, format_duration(this.get_session_time()))
  }

  /* attribute getters and setters */
  get name()  { return this.get_backend("name") }
  set name(v) { this.set_backend("name", v) }
  get time_saved() { return this.get_backend("time_saved") }
  set time_saved(v) {
    this.set_backend("time_saved", v)
    set_text(this.duration_total_element, format_duration(v))
  }
  get time_last_start() { return this.get_backend("time_last_start") }
  set time_last_start(v) {
    this.set_backend("time_last_start", v)
    if (!this.time_last_start_element) return
    let new_time_last_start_element = Project.generate_timestamp_element(v)
    this.time_last_start_element.replaceWith(new_time_last_start_element)
    this.time_last_start_element = new_time_last_start_element
  }
  get duration_last_session() { return this.get_backend("duration_last_session") }
  set duration_last_session(v) {
    this.set_backend("duration_last_session", v)
    set_text(this.duration_last_session_element, format_duration(v))
  }
  get running() { return this.get_backend("running") }
  set running(state) {
    this.set_backend("running", state)
    if (state === false) this.update_running_durations()
    this.session_toggle_element?.setAttribute("running", state)
    this.session_cancel_element?.setAttribute("running", state)
  }

  /* session time control */
  get_session_time() {
    if (!this.running) return 0
    let present = Date.now()
    return present - (this.time_last_start ?? present)
  }
  get_duration_total() {
    return this.time_saved + this.get_session_time()
  }
  session_toggle() {
    if (this.running) {
      // End the session
      this.duration_last_session = this.get_session_time() // capture run time
      this.running = false
      this.time_saved += this.duration_last_session
    } else {
      // Start a new session
      this.time_last_start = Date.now() // capture start time
      this.running = true
      this.session_count.inc()
    }
  }
  session_cancel() {
    if (!this.running) return
    this.running = false
    this.session_count.dec()
  }
  project_reset() {
    if (!window.confirm("Do you really want to reset this project?")) return
    this.running = false
    this.session_count.reset()
    this.time_saved = 0
    this.time_last_start = null
    this.duration_last_session = null
  }
  generate() {
    return DIV({"class": "project-container","id":this.time_created},
      null, [
      DIV({"class":"row"}, null, [
        ELEMENT("input",
          {"class":"project-name-input","type":"text","placeholder":"unnamed project"},
          this.name, null, null, (e) => { this.name = e.target.value }
        ),
        DIV({"class":"button delete-button"}, "delete", null,
          () => {
            window.clearInterval(this.interval_id)
            PROJECTS.del_project(this.time_created)
          }
        )
      ]),
      DIV({"class":"row timestamp-row"}, null, [
        DIV({"class":"center"}, null, [
          DIV({"class":"underlined"}, "created"),
          this.time_created_element,
        ]),
        DIV({"class":"center"}, null, [
          DIV({"class":"underlined"}, "sessions"),
          this.session_count.element
        ]),
        DIV({"class":"center"}, null, [
          DIV({"class":"underlined"}, "last session"),
          this.time_last_start_element,
        ])
      ]),
      DIV({"class": "row duration-row"}, null, [
        DIV({"class":"center"}, null, [
          DIV({"class":"underlined"}, "total"),
          this.duration_total_element
        ]),
        DIV({"class":"center"}, null, [
          DIV({"class":"underlined"}, "session"),
          this.duration_curr_session_element
        ]),
        DIV({"class":"center"}, null, [
          DIV({"class":"underlined"}, "last session"),
          this.duration_last_session_element
        ])
      ]),
      DIV({"class":"row"}, null, [
        this.session_toggle_element,
        this.session_cancel_element,
        this.project_reset_element
      ])
    ])
  }
}
