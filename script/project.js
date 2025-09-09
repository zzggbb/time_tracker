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
    this.time_created_element = this.generate_timestamp_element(this.time_created)
    this.time_last_start_element = this.generate_timestamp_element(this.time_last_start)
    this.session_count_element = DIV({"class":"session-count"}, this.session_count)
    this.duration_total_element = DIV({"class":"time duration-total"},
      Project.format_duration(this.get_duration_total())
    )
    this.duration_curr_session_element = DIV({"class":"time duration-curr-session"},
      Project.format_duration(this.get_session_time())
    )
    this.duration_last_session_element = DIV({"class":"time duration-last-session"},
      this.duration_last_session ? Project.format_duration(this.duration_last_session) : "none"
    )
    this.session_toggle_element = DIV({
      "class": "button toggle-button",
      "running": this.running
    }, null, null, this.session_toggle.bind(this))
    this.session_cancel_element = DIV({
      "class": "button cancel-button",
      "running": this.running
    }, null, null, this.session_cancel.bind(this))
    this.reset_element = DIV({
      "class":"button reset-button"
    }, null, null, this.reset.bind(this))

    window.setInterval(() => {
      if (!this.running) return // we can return early because nothing is changing
      this.update_running_durations()
    }, 10)
  }
  generate_timestamp_element(timestamp) {
    return DIV({"class":"timestamp"}, null,
      Project.format_timestamp(timestamp).map((text) => {
        return DIV({"class":"timestamp-section"}, text)
      })
    )
  }
  update_running_durations() {
    this.duration_total_element.textContent = Project.format_duration(this.get_duration_total())
    this.duration_curr_session_element.textContent = Project.format_duration(this.get_session_time())
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
      this.duration_last_session_element.textContent = Project.format_duration(this.duration_last_session)

      this.set_backend("time_saved", this.time_saved)
      // no need to update the total duration, the window interval does it

      this.duration_curr_session_element.textContent = Project.format_duration(0)
    } else {
      // start a new session
      this.time_last_start = Date.now()
      this.running = true

      this.session_count += 1
      this.set_backend("session_count", this.session_count)
      this.session_count_element.textContent = this.session_count

      this.set_backend("time_last_start", this.time_last_start)
      let new_time_last_start_element = this.generate_timestamp_element(this.time_last_start)
      this.time_last_start_element.replaceWith(new_time_last_start_element)
      this.time_last_start_element = new_time_last_start_element
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
    let name = this.name ? `"${this.name}"` : "the project"
    if (!window.confirm(`Do you really want to reset ${name}?`))
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
    this.duration_last_session_element.textContent = Project.format_duration(this.duration_last_session)

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
  static format_timestamp(time_ms) {
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
  static format_duration(time_ms, separator=":", enable_ms=false) {
    const unit_names = ["h", "m", "s", "ms"]
    const unit_divisors = [1, 60, 60, 1000]
    const unit_paddings = [3, 2, 2, 3]
    const N = unit_names.length

    if (time_ms === null) return "none"
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

    return DIV({
      "class": "project-container",
      "id": this.time_created
    }, null, [
      DIV({"class":"row"}, null, [
        name_input,
        DIV({"class":"button delete-button"}, null, null,
          () => { PROJECTS.del_project(this.time_created) }
        )
      ]),
      DIV({"class":"row timestamp-row"}, null, [
        DIV({"class":"center"}, null, [
          DIV({"class":"underlined"}, "created"),
          this.time_created_element,
        ]),
        DIV({"class":"center"}, null, [
          DIV({"class":"underlined"}, "sessions"),
          this.session_count_element
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
        this.reset_element
      ])
    ])
  }
}
