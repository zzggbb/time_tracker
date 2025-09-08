class Project {
  constructor(name=null, time_created=null,
              time_saved=0, time_last_start=null, duration_last_session=null,
              running=false, session_count=0) {
    this.name = name
    this.time_created = time_created ?? Date.now() // Used to uniquely identify the project
    this.time_saved = time_saved
    this.time_last_start = time_last_start
    this.duration_last_session = duration_last_session
    this.running = running
    this.session_count = session_count

    this.time_last_start_element = ELEMENT("div", {"class":"time-last-start"},
      this.time_last_start === null ? "never" : new Date(this.time_last_start)
    )
    this.session_count_element = ELEMENT("div", {"class":"session-count"},
      this.session_count
    )
    this.duration_total_element = ELEMENT("div", {"class":"time duration-total"},
      Project.format_time(this.get_duration_total())
    )
    this.duration_curr_session_element = ELEMENT("div", {"class":"time duration-curr-session"},
      Project.format_time(this.get_session_time())
    )
    this.duration_last_session_element = ELEMENT("div", {"class":"time duration-last-session"},
      this.duration_last_session ? Project.format_time(this.duration_last_session) : "none"
    )
    this.session_toggle_element = ELEMENT("div", {
      "class": "button toggle-button",
      "running": this.running
    }, null, null, this.session_toggle.bind(this))
    this.session_cancel_element = ELEMENT("div", {
      "class": "button cancel-button",
      "running": this.running
    }, null, null, this.session_cancel.bind(this))
    this.reset_element = ELEMENT("div", {
      "class":"button reset-button"
    }, null, null, this.reset.bind(this))

    window.setInterval(() => {
      if (!this.running) return // we can return early because nothing is changing
      this.update_running_durations()
    }, 10)
  }
  update_running_durations() {
    this.duration_total_element.textContent = Project.format_time(this.get_duration_total())
    this.duration_curr_session_element.textContent = Project.format_time(this.get_session_time())
  }
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
      // end the session
      this.duration_last_session = this.get_session_time()
      this.time_saved = this.time_saved + this.duration_last_session

      this.running = false
      this.update_running_durations()

      this.set_backend("duration_last_session", this.duration_last_session)
      this.duration_last_session_element.textContent = Project.format_time(this.duration_last_session)

      this.set_backend("time_saved", this.time_saved)
      // no need to update the total duration, the window interval does it

      this.duration_curr_session_element.textContent = Project.format_time(0)
    } else {
      // start a new session
      this.time_last_start = Date.now()
      this.running = true

      this.session_count += 1
      this.set_backend("session_count", this.session_count)
      this.session_count_element.textContent = this.session_count

      this.set_backend("time_last_start", this.time_last_start)
      this.time_last_start_element.textContent = new Date(this.time_last_start)
    }
    this.set_backend("running", this.running)
    this.session_toggle_element.setAttribute("running", this.running)
    this.session_cancel_element.setAttribute("running", this.running)
  }
  session_cancel() {
    if (!this.running) return

    this.running = false
    this.update_running_durations()

    this.set_backend("running", this.running)
    this.session_toggle_element.setAttribute("running", this.running)
    this.session_cancel_element.setAttribute("running", this.running)

    this.session_count -= 1
    this.set_backend("session_count", this.session_count)
    this.session_count_element.textContent = this.session_count
  }
  reset() {
    let name = this.name ? `project "${this.name}"` : "the project"
    if (!window.confirm(`Are you sure you want to reset ${name}?`))
      return

    this.running = false

    this.set_backend("running", this.running)
    this.session_toggle_element.setAttribute("running", this.running)
    this.session_cancel_element.setAttribute("running", this.running)

    this.session_count = 0
    this.set_backend("session_count", this.session_count)
    this.session_count_element.textContent = this.session_count

    this.time_saved = 0
    this.set_backend("time_saved", this.time_saved)

    this.time_last_start = null
    this.set_backend("time_last_start", this.time_last_start)
    this.time_last_start_element.textContent = "never"

    this.duration_last_session = null
    this.set_backend("duration_last_session", this.duration_last_session)
    this.duration_last_session_element.textContent = Project.format_time(this.duration_last_session)

    this.update_running_durations()
  }
  static from_json(o) {
    return new Project(...Object.values(o))
  }
  to_json() {
    return {
      "name": this.name,
      "time_created": this.time_created,
      "time_saved": this.time_saved,
      "time_last_start": this.time_last_start,
      "duration_last_session": this.duration_last_session,
      "running": this.running,
      "session_count": this.session_count
    }
  }
  set_backend(key, value) {
    let projects = STORAGE.get("projects")
    let project = projects[this.time_created]
    project[key] = value
    STORAGE.set("projects", projects)
  }
  static format_time(time_ms) {
    if (time_ms === null)
      return "none"

    // H:M:S:MS
    let t = time_ms

    let hours = Math.floor(t / (1000*60*60))
    t = t - hours*1000*60*60

    let minutes = Math.floor(t / (1000*60))
    t = t - minutes*1000*60

    let seconds = Math.floor(t / (1000))
    t = t - seconds*1000

    let milliseconds = Math.floor(t)

    minutes = String(minutes).padStart(2, '0')
    seconds = String(seconds).padStart(2, '0')
    milliseconds = String(milliseconds).padStart(3, '0')
    return `${hours}h ${minutes}m ${seconds}s ${milliseconds}ms`
  }
  generate() {
    let name_input = ELEMENT("input", {
      "class": "project-name-input",
      "type": "text",
      "placeholder": "type a name for your project"
    }, this.name)
    name_input.oninput = (event) => {
      let new_name = name_input.value
      this.set_backend("name", new_name)
      this.name = new_name
    }

    return ELEMENT("div", {
      "class": "project-container",
      "id": this.time_created
    }, null, [
      name_input,
      ELEMENT("div", {"class": "button delete-button"}, "delete project", null,
        () => { PROJECTS.del_project(this.time_created) }
      ),
      ELEMENT("div", {"class": "time-created"}, new Date(this.time_created)),
      this.time_last_start_element,
      this.session_count_element,
      this.duration_total_element,
      this.duration_curr_session_element,
      this.duration_last_session_element,
      this.session_toggle_element,
      this.session_cancel_element,
      this.reset_element
    ])
  }
}
