const TOP_KEY = "time_tracker"

class Storage {
  constructor(o) {
    if (window.localStorage.getItem(TOP_KEY))
      return

    window.localStorage.setItem(TOP_KEY, "{}")
    for (let [k, v] of Object.entries(o))
      this.set(k, v)
  }
  set(key, value) {
    let current = JSON.parse(window.localStorage.getItem(TOP_KEY))
    current[key] = value
    window.localStorage.setItem(TOP_KEY, JSON.stringify(current))
  }
  get(key, fallback = null) {
    let value = JSON.parse(window.localStorage.getItem(TOP_KEY))[key]
    if (value == null) return fallback
    try { return JSON.parse(value) } catch { return value }
  }
  clear() {
    window.localStorage.clear()
  }
}
