* Refactor around a table of all past sessions.
  Each session has the following fields:
    * description
    * start time
    * duration
    * image (user uploaded)
  A session can be deleted from the session table.
  The following state variables would then be refactored out, because they
  can be derived from the session table:
    * time_saved - sum(session.duration for session in table)
    * time_last_start - table.most_recent.start_time
    * duration_last_session - table.most_recent.duration
    * session_count - len(table)

* Add ability to manually input a project's total duration
