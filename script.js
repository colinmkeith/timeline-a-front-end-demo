jQuery.noConflict();
(function($) {
  $(function() {

    var trkTaskManager = function(storedTasks) {
      this.tasks = storedTasks || {};

      this.currentTask = function() {
        return $('.trkcurtask').val();
      };

      this.completeTask = function(start, stop) {
        this.storeTask(this.currentTask(), start, stop);
      };

      this.setTask = function(taskName, start, stop) {
        if(!this.tasks[taskName]) {
          this.tasks[taskName] = [];
        }

        this.tasks[taskName].push([start, stop]);
      };

      this.getTasks = function() {
        return this.tasks;
      };

      this.getTask = function(taskName) {
        if(!this.tasks || !this.tasks[taskName]) {
          return null;
        }
        return this.tasks[taskName];
      };

      this.formatTime = function(time) {
        if(time >= 86400) {
          time /= 86400;
          return time.toFixed(2).replace(/\.0[0-9]$/, '') + 'd';
        }

        if(time >= 3600) {
          time /= 3600;
          return time.toFixed(2).replace(/\.0[0-9]$/, '') + 'h';
        }

        if(time >= 60) {
          time /= 60;
          return Math.round(time) + 'm';
        }

        if(time === 0) {
          return '';
        }

        return time + 's';
      };

      this.sumTasks = function(dateType, dateOffset) {
        if(!dateType) {
          dateType = 'week';
        }

        var startRange = moment().startOf(dateType).format("X");

        var tbl = $('.trktbl tbody');
        var dataRows = tbl.find('tr.trktask');
        var t = this;

        $.each(this.getTasks(), function(taskName) {
          var k, elapsedData;
          var summary = t.sumTask(taskName, startRange, dateType);
          var tblRow = $.grep(dataRows, function(el, idx) {
            return $(el).data('taskname') === taskName;
          });

          if($.isArray(summary)) {
            var sumData = summary[1];
            summary = summary[0];

            elapsedData = [ summary ];

            for(k=0; k<sumData.length; k++) {
              if(typeof(elapsedData[k+1]) === 'undefined') {
                elapsedData[k+1] = 0;
              }

              if(typeof(sumData[k]) !== 'undefined') {
                elapsedData[k+1] += sumData[k].sum;
              }
            }

            for(k=0; k<elapsedData.length; k++) {
              elapsedData[k] = t.formatTime(elapsedData[k]);
            }
          }

          else {
            elapsedData = [0];
          }

          t.addNewRow(tblRow, elapsedData);

          if(!tblRow) {
            t.addNewRow(taskName, summary);
          }
        });

        var totalTime = 0;
        var taskTimes = [];

        var taskRows = $('.trktask');
        taskRows.each(function(idx, row) {
          var cells = $(row).find('td');
          // var taskName = $(cells[0]).text();
          var taskTime = $(cells[1]).text() || 0;

          if(taskTime === '0m') {
            taskTime = 0;
          } else {
            var timeparts = taskTime.match(/^([0-9.]+)([dhms])$/);
            if(timeparts.length) {
              taskTime = timeparts[1] * { d : 86400, h : 3600, m : 60, s : 1 }[timeparts[2]];
            } else {
              taskTime = 0;
            }
          }

          totalTime += taskTime;
          taskTimes.push(taskTime);
        });

        $(taskTimes).each(function(idx, taskTime) {
           var taskPct  = Math.round(taskTime * 100 / totalTime) || 1;
           var remainingPct = 100 - taskPct;
           var cell = $($(taskRows[idx]).find('td')[1]);
           var spline = $(cell).find('.sparkline');
           if(spline.length === 0) {
             spline = $('<span class="sparkline"/>');
             cell.append(spline);
           }
           $(spline).sparkline([taskPct, remainingPct], { type : 'pie' });
        });
      };

      this.sumTask = function(taskName, startRange, dateType) {
        var i, j;
        var taskData = this.getTask(taskName);
        if(taskData === null || !taskData.length) {
          return [ 0, [] ];
        }

        var stopRange  = moment().endOf(dateType).format("X");

        /* Save resources - Can't have done tasks in the future */
        if(stopRange > moment().format('X')) {
          stopRange = moment().format('X');
        }

        var dateRanges = [ parseInt(startRange, 10) ];

        switch(dateType) {
          case 'week':
            var rangePtr = startRange;
            while(rangePtr < stopRange) {
              var endOfDay = moment(rangePtr, 'X').add(86400-1, 'second').format('X');
              dateRanges.push(endOfDay++);

              if(endOfDay < stopRange) {
                dateRanges.push(endOfDay);
              }

              rangePtr = endOfDay;
            }
            break;
        }

        var totalTime = 0;
        var sumTimes  = [];
        for(j=0; j<taskData.length; j++) {
          var el = taskData[j];

          /* Not in current date range, not interested */
          if(el[0] < $(dateRanges).first() && el[1] > $(dateRanges).last() ) {
            return;
          }

          if(el[0] < $(dateRanges).first()) {
            el[0] = $(dateRanges).first();
          }

          if(el[1] < $(dateRanges).last()) {
            el[1] = $(dateRanges).last();
          }


          for(i=0; i<dateRanges.length; i+=2) {
            var startTime = el[0],
              stopTime = el[1],
                       rangeStart = dateRanges[i],
                       rangeStop = dateRanges[i+1];

            /*
               console.log('rangeStart = %o, rangeStop = %o', rangeStart, rangeStop);
               console.log('startTime = %o, stopTime = %o', startTime, stopTime);
             */

            if(rangeStart > startTime) {
              /* console.log('move on'); */
              break;
            }

            if(rangeStop <= startTime) {
              /* console.log('check next range'); */
              continue;
            }

            if(stopTime > rangeStop) {
              taskData.splice(j+1, 0, [ rangeStop, stopTime ]);
              stopTime = rangeStop;
            }

            var timeOnTask = stopTime - startTime;
            totalTime += timeOnTask;

            var idx = (i/2)-1;

            if(typeof(sumTimes[idx]) === 'undefined') {
              sumTimes[idx] = { sum : 0, events : [] };
            }

            sumTimes[idx].sum += timeOnTask;
            sumTimes[idx].events.push([ el[0], el[1] ]);
          }
        }

        return [ totalTime, sumTimes ];
      };

      this.storeTask = function(taskName, start, stop) {
        this.setTask(taskName, start, stop);
        store.set('trktask', this.getTasks());
      };

      this.newTaskPrompt = function(ev) {
        if(ev) {
          ev.preventDefault();
          ev.stopPropagation();
        }
        $('.trknewtaskgroup').show();
        $('#trknewtask').focus();
      };

      this.addTask = function(taskName, selectEl) {
        taskName = taskName.replace(/^\s+/, '').replace(/\s+$/, '');
        if(!taskName || taskName === '#new') {
          return;
        }

        if(!this.tasks[taskName]) {
          this.tasks[taskName] = [];
        }

        if(selectEl.find('option[value="' + taskName + '"]').length === 0) {
          selectEl.append($('<option>', {
            value : taskName,
            text  : taskName
          })).removeAttr('disabled')
          .find('option').last()[0].selected = true;
          selectEl.trigger('change');
        }

        if(this.tasks.length === 0) {
          $('.trkblankrow').show();
        } else {
          $('.trkblankrow').hide();
          $('.trktimerstart').removeClass('disabled')
            .removeAttr('disabled')
            .removeAttr('title');
        }

        this.addNewRow(taskName);
      };

      this.addNewRow = function(taskName, data) {
        if(typeof(data) === 'undefined') {
          data = [];
        }

        var trkClone;

        if(typeof(taskName) === 'string') {
          trkClone = $('.trkcloneable').clone();
        } else {
          trkClone = $(taskName);
        }

        var tds = trkClone.find('td');

        if(data.length) {
          $.each([0, 1, 2, 3, 4, 5, 6], function(i) {
            if(data[i]) {
              $(tds[i+1]).text(data[i]);
            }
          });
        } else {
          $(tds[1]).text('0m');
        }

        if(typeof(taskName) === 'string') {
          $(tds[0]).text(taskName).attr('title', taskName);
          trkClone.removeClass('trkcloneable')
            .addClass('trktask')
            .data('taskname', taskName);

          var tbody = $('.trktbl tbody');
          var insBefore = tbody.find('.trktask').first();
          if(insBefore.length) {
            trkClone.insertBefore(insBefore);
          } else {
            $(tbody).append(trkClone);
          }
        }
      };

      /* Initialize */
      var selectEl = $('.trkcurtask');
      var t = this;
      $.each(this.tasks, function(key, val) {
        t.addTask(key, selectEl);
      });

      var numOfTasks = 0;
      if(typeof(Object.keys) === 'undefined') {
        var key;
        for(key in obj) {
          if(obj.hasOwnProperty(key)) {
            numOfTasks = 1;
            break;
          }
        }
      } else {
        numOfTasks = Object.keys(this.tasks).length;
      }

      if(numOfTasks) {
        $('.trktimerstart').removeClass('disabled')
          .removeAttr('disabled')
          .removeAttr('title');
      } else {
        $('.trktimerstart').addClass('disabled')
          .attr({
            disabled : 'disabled',
            title    : 'Select Or Enter new Task'
          });
      }

      this.sumTasks();
    };

    var trkTimer = function() {
      this.ANIMATE_CLASS = 'trkindicator-animate';
      this.isRunning = 0;

      this.toggle = function(taskMan) {
        if(this.isRunning) {
          this.stop(taskMan);
        } else {
          this.start();
        }
      };

      this.start = function() {
        $('.trktimerstart').addClass('disabled')
          .attr({
            disabled : 'disabled',
            title    : 'Select Or Enter new Task'
          });
        $('.trktimerstop').removeClass('disabled')
          .removeAttr('disabled')
          .removeAttr('title');

        if(this.isRunning) {
          return;
        }

        $('.trkcurtask, .modal-header .close').attr({
          disabled : 'disabled',
          title    : 'Select Or Enter new Task'
        });

        this.isRunning = 1;
        this.startTime = Math.floor(new Date().getTime() / 1000);
        this.timer();
        $('.trkindicator').addClass(this.ANIMATE_CLASS);
        $('.trkdd').text('0d');
        $('.trkhm').text('00:00');
        $('.trkss').text('0s');
      };

      this.stop = function(taskMan) {
        $('.trktimerstart').removeClass('disabled').removeAttr('disabled');
        $('.trktimerstop').addClass('disabled')
          .attr({
            disabled : 'disabled',
            title    : 'Select Or Enter new Task'
          });

        this.isRunning = 0;

        if(this.timeHdl) {
          clearInterval(this.timeHdl);
        }

        $('.trkindicator').removeClass(this.ANIMATE_CLASS);
        $('.trkcurtask, .modal-header .close').removeAttr('disabled');

        var stopTime = Math.floor(new Date().getTime() / 1000);
        taskMan.completeTask(this.startTime, stopTime);
        taskMan.sumTasks();
      };

      this.updateTime = function() {
        var elapsedTime = Math.floor((new Date(new Date().getTime()- (this.startTime * 1000))).getTime() / 1000);
        var dd = Math.floor((elapsedTime / 86400) % 60);
        var hh = Math.floor((elapsedTime / 3600) % 60);
        var mm = Math.floor((elapsedTime / 60) % 60);
        var ss = Math.floor((elapsedTime) % 60);

        if(mm !== this.oldminute) {
          this.oldminute = mm;
          $('.trkindicator').removeClass(this.ANIMATE_CLASS)
            .addClass(this.ANIMATE_CLASS);
        }

        if(hh < 10) {
          hh = '0' + hh;
        }

        if(mm < 10) {
          mm = '0' + mm;
        }

        if(ss < 10) {
          ss = '0' + ss;
        }

        $('.trkss').text(ss + 's');
        $('.trkdd').text(dd + 'd');
        $('.trkhm').text(hh + ':' + mm);
      };

      this.timer = function() {
        var func = this.updateTime;
        var scope = this;
        this.timeHdl = setInterval(function() { func.apply(scope); }, 1000);
      };
    };

    $(document).ready(function($) {
      var timer    = new trkTimer();
      var taskMan  = new trkTaskManager(store.get('trktask'));
      /* DEBUG */
      window.taskMan = taskMan;
      window.timer   = timer;

      $('.trkcurtask').on('click keyup', function(ev) {
        var targ = ev.target;
        if(targ) {
          if(targ.nodeName === 'SELECT') {
            if(targ.options.length === 1 ||
              (ev.type === 'keyup' && ev.key === 'Enter' && $(targ).val() === '#new')) {
                taskMan.newTaskPrompt(ev);
              }
          }

          else if(targ.nodeName === 'OPTION' && $(targ).val() === '#new') {
            taskMan.newTaskPrompt(ev);
          }
        }
      })
      .on('change', function(ev) {
        ev.target.blur();
        if($(ev.target).val() === '#new') {
          taskMan.newTaskPrompt(ev);
        } else {
          $('.trktimer').removeAttr('disable').parent().tooltip('destroy');
          $('.trktimerstart').removeAttr('disable').parent().tooltip('destroy');
          $('.trknewtaskgroup').hide();
        }
      })
      .on('focus', function(ev) {
        var options = $(ev.target).find('option');
        if(options.length < 2) {
          taskMan.newTaskPrompt(ev);
        }
      });

      $('.trktimer').on('click', '*', function(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        if($('.trkcurtask').val() === '#new') {
          $('.trktimer').attr('disable', 'disable')
        .parent().tooltip({ title : 'Create or Select Task to Start' })
        .tooltip('show');
      return;
        }
        timer.toggle(taskMan);
      });

      $('.trktimerstart').click(function(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        if($('.trkcurtask').val() === '#new') {
          $('.trktimerstart').attr('disable', 'disable')
        .parent().tooltip({ title : 'Create or Select Task to Start' })
        .tooltip('show');
      return;
        }
        timer.start();
        $('.trktimestop').focus();

        if(tour._current === 4) {
          tour.next();
        }
      });

      $('.trktimerstop').click(function(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        timer.stop(taskMan);

        $('.trktimestop').blur();

        if(tour._current === 6) {
          setTimeout(function() {
            tour.next();
          }, 2000);
        }
      });

      $('.trktaskpick').on('submit', function(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        taskMan.addTask($('#trknewtask').val(), $('#trkcurtask'));

        // Maybe we should leave it?
        $('#trknewtask').val('');

        $('.trknewtaskgroup').hide();

        if(tour._current === 1) {
          tour.next();
          $('#step-1').remove();
        }
      });

      /* Helper to make Timer prompt for tasks when first started */
      /* Work around bug in https://github.com/twbs/bootstrap/commit/4b1a6e11326fee97a5ebc194be040086f40f97fb */
      $(document).on('shown.bs.modal', function(ev) {
        if(tour._current === 0) {
          $('#trkcurtask option[value="#new"]').prop('selected', true);
          $('#trkcurtask').trigger('change');
          tour.next();
        }

        if($('.trktaskpick').find('option').length < 2) {
          taskMan.newTaskPrompt();
        }
      });

      /*
         $(document).on('hidden.bs.modal', function(ev) {
         if(tour._current === 9) {
         tour.next();
         }
         });
       */

      $('.trknewtaskgroup').on('keyup', function(ev) {
        if(ev.key === 'Esc') {
          $('.trknewtaskgroup').hide();
        }
      });

      store.remove('tour_current_step');
      var tour = new Tour({debug: true});

      /* It is goTo() in newer versions */
      if(typeof(tour.goTo) === 'undefined') {
        tour.goTo = tour.goto;
      }

      tour.addSteps([
          {
            element   : '#showtimer',
        title     : 'Welcome to Task Timer',
        content   : 'Welcome. To start click the Start Timer button.',
        placement : 'bottom'
          },

          {
            element   : '#trkcurtask',
        title     : 'Task Timer Window',
        content   : 'Before you can start timing, you need to add a New Task.<p>Enter a new task name, for Example. "<b>Development</b>", then click the "<b>Add New Task</b>" buton.</p>',
        placement : 'top',
        onShown   : function(tour) {
          if($('.trknewtaskgroup').is("  :visible").length === 0) {
            $('#trkcurtask option[value="#new"]').prop('selected', true); $('#trkcurtask').click();
          }
        }
          },

          {
            element   : '.trktask:first :nth-child(1)',
            title     : 'Task Added',
            content   : 'The new Task is added to the list of available tasks.',
            placement : 'bottom',
            prev      : 1,
            next      : 3,
            onShow    : function(tour) {
              setTimeout(function() {
                tour.next();
              }, 2000);
            }
          },

          {
            element   : '#trkcurtask',
            title     : 'Task Available',
            content   : 'The Task is now available for timing.',
            placement : 'top',
            onShown   : function(tour) {
              setTimeout(function() {
                tour.next();
              }, 2000);
            }
          },

          {
            element   : '.trktimerstart',
            title     : 'Start Timer',
            content   : 'Click to start timing the task.',
            placement : 'top',
            onShown   : function(tour) {
              /* You're already ahead of us ... */
              if(timer.isRunning) {
                tour.next();
              }
            }
          },

          {
            element   : '.trkss',
            title     : 'Time Indicator',
            content   : 'The timer is running...',
            placement : 'top',
            onShown   : function(tour) {
              setTimeout(function() {
                tour.next();
              }, 2000);
            }
          },

          {
            element   : '.trktimerstop',
            title     : 'Stop Timer',
            content   : 'Click to stop timing the task.<br/>It will automatically stop after 20s',
            placement : 'top',
            onShown   : function(tour) {
              setTimeout(function() {
                $('.trktimerstop').click();
              }, 18000);
            }
          },

          {
            element   : '.trktask:first > td:nth-child(2)',
            title     : 'Time Recorded',
            content   : 'The time spent on this Task is added to the timeline breakdown.',
            placement : 'bottom',
            onShow    : function(tour) {
              setTimeout(function() {
                tour.next();
              }, 2000);
            }
          },

          {
            element   : '.modal-header .close',
            title     : 'Close Window',
            content   : 'You can now close the window in the upper-right corner, add a new task, or log more time on the same task.',
            placement : 'bottom',
            onShow    : function(tour) {
              setTimeout(function() {
                $('.modal-header .close').modal('hide');
                tour.end();
              }, 2000);
            }
          },

          /*
             {
             element   : '.modal-header .close',
             title     : 'Close Window',
             content   : 'You can now close the window in the upper-right corner, add a new task, or log more time on the same task.',
             placement : 'bottom',
             onShow    : function(tour) {
             setTimeout(function() {
             tour.next();
             }, 2000);
             }
             },
           */

          ]);

      tour.start();
      /* DEBUG */
      window.tour = tour;
    });

  });
}(jQuery));
