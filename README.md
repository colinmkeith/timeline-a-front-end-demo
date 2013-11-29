Time Tracker Demo
=================

Timeline: A demo of front-end coding using Bootstrap and jQuery.

[Online Demo](http://colinmkeith.github.io/timeline-a-front-end-demo/)

TODO
----

Features to add or upgrade are:

* Add sorting to columns headers;

    * By Task

    * By Total time

    * By time, for each day.

* Change Days => Short days and add date for that day, e.g. Mon 14th

* List Date range for current display.

* Arrows to left/right to increment/decrement by one week.

* Button to change date which pops up a calendar by which you can set the date to display

* "Manage Tasks" button. Allowing you to input a start/stop time manually, rename a task, add a new task, edit a task or delete a task. Potentially the manual start/stop time entry could be moved to a separate panel.

* Expand Task input to allow them to belong to a project

* Possibly expand tasks to allow them to be assigned to a company

* Change tasks from using a task name to using a unique ID. Potentially this should be a UUID for later functionality [JS library for generating UUIDs](http://www.broofa.com/2008/09/javascript-uuid-function/). By assigning a task a UUID the client facing properties can be changed, I.e. it can be renamed, or assigned to different project or company. Indeed this is good because it allows the client to determine if they want just tasks or if they want tasks within projects or a full company-project-task hierarchy.

* Automatic "saving" of time. So every 10 minutes a task is added to the data store. This prevents problems if the browser crashes part way though a 3 hour task.

NEXT VERSION :: Multi User
--------------------------

At this point the serious consideration needs to be applied to multi-user
situations. For example you install for a company and everyone in that company
uses it for time tracking. This is a big step up from a simple task timer, but
the basis is still the same. You have a task X and it starts being worked on at
time Y until time Z, with Y->Z pairs repeating infinitely.

This data could be entered for any point in time (migrating from an old system,
back-dating entries, going forward into the future), so the data does not fit a
well into a column-based database. A better approach would be to use a row based
datastore, such as Redis. In this case a task has a unique ID and that is used
for the key for the time data. We want to be able to use this as an off-line
client which syncs to the server. As such clients should be able to generate a
UUID locally (See above) and submit that to the database.

Thus we would seem to need:

INCR next.company.id
INCR next.project.id
INCR next.task.id

SET company:$COMPANYID:label = "Bank Co."
SET project:$PROJECTID:label = 'Bank App'
SET task:$TASKID:label    = 'Development'

SADD companies $COMPANYID
SADD company:$COMPANYID:projects $PROJECTID
SADD project:$PROJECTID:tasks $TASKID

Time for a task is thus added using:

SADD task:$TASKID:time "$starttime:$stoptime:$employeeid"

However this might be better written as though each record was an event. Thus:

INCR next.event.id
SET event:$EVENTID:start = $startTime
SET event:$EVENTID:stop  = $stopTime
SET event:$EVENTID:type  = $eventType      (Work, automated, review, accounting... ?)
SET event:$EVENTID:owner = $employeeID

To get an event we would pull all of the records for that event ID. Doing it
this way lets the client decide what information to add. For example they could
add new fields:

SET event:$EVENTID:billrate = $billingRate
SET event:$EVENTID:taxrate  = $taxRate

Since we refer to an event by its ID we can therefore store them in a list:

SADD task:$TASKID:events $EVENTID
