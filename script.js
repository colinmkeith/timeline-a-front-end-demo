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

      this.sumTask = function(taskName, startRange, stopRange, bySize) {
        var taskData = this.getTask(taskName);
        if(taskData === null || !taskData.length) {
          return [ 0 ];
        }

        var ret = [ 0 ];
        $.each(taskData, function(idx, el){
          /* Not in current date range, not interested */
          if(el[0] < startRange && el[1] > stopRange) {
            return;
          }

          /* cap the start/stop to ranges */
          if(el[0]< startRange) {
            el[0] = startRange;
          }

          if(el[1] > stopRange) {
            el[1] = stopRange;
          }

          var timeOnTask = el[1] - el[0];
          ret[0] += timeOnTask;
          ret.push([el[0], el[1]]);
        });

        return ret;
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
        if(!this.tasks[taskName]) {
          this.tasks[taskName] = [];
        }

        if(selectEl.find('option[value="' + taskName + '"]').length === 0) {
          selectEl.append($('<option>', {
            value : taskName,
            text  : taskName
          })).removeAttr('disabled')
          .find('option').last()[0].selected = true;
        }

        if(this.tasks.length === 0) {
          $('.trkblankrow').show();
        } else {
          $('.trkblankrow').hide();
        }

        this.addNewRow(taskName);
      };

      this.addNewRow = function(taskName, data) {
        if(typeof(data) === 'undefined') {
          data = [];
        }
        var trkClone = $('.trkcloneable').clone();
        var tds = trkClone.find('td');
        $(tds[0]).text(taskName).attr('title', taskName);
        if(data.length) {
          $.each([0, 1, 2, 3, 4, 5, 6], function(i) {
            if(data[i]) {
              $(tds[i+1]).text(data[i]);
            }
          });
        } else {
          $(tds[1]).text('0m');
        }
        trkClone.removeClass('trkcloneable')
          .addClass('trktask')
          .data('taskname', taskName);

        var tbody = $('.trktbl tbody');
        var insBefore = tbody.find('.trktask').first();
        if(insBefore.length) {
          $(insBefore).insertBefore(trkClone);
        } else {
          $(tbody).append(trkClone);
        }
      };

      /* Initialize */
      var selectEl = $('.trkcurtask');
      var t = this;
      $.each(this.tasks, function(key, val) {
        t.addTask(key, selectEl);
      });

    };

    var trkTimer = function() {
      this.ANIMATE_CLASS = 'trkindicator-animate';
      this.isRunning = 0;

      this.start = function() {
        if(this.isRunning) {
          return;
        }

        this.isRunning = 1;
        this.startTime = Math.floor(new Date().getTime() / 1000); /* Use seconds */
        this.timer();
        $('.trkindicator').addClass(this.ANIMATE_CLASS);
        $('.trkdd').text('0d');
        $('.trkhm').text('00:00');
        $('.trkss').text('0s');
      };

      this.stop = function(taskMan) {
        this.isRunning = 0;
        if(this.timeHdl) {
          clearInterval(this.timeHdl);
        }
        $('.trkindicator').css({transform : $('.trkindicator').css('transform') });
        $('.trkindicator').removeClass(this.ANIMATE_CLASS);

        var stopTime = Math.floor(new Date().getTime() / 1000); /* Use seconds */
        taskMan.completeTask(this.startTime, stopTime);
      };

      this.updateTime = function() {
        var elapsedTime = Math.floor((new Date(new Date().getTime()- (this.startTime * 1000))).getTime() / 1000);
        var dd = Math.floor((elapsedTime / 86400) % 60);
        var hh = Math.floor((elapsedTime / 3600) % 60);
        var mm = Math.floor((elapsedTime / 60) % 60);
        var ss = Math.floor((elapsedTime) % 60);

        if(mm !== this.oldminute) {
          this.oldminute = mm;
          $('.trkindicator').removeClass(this.ANIMATE_CLASS);
          $('.trkindicator').addClass(this.ANIMATE_CLASS);
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
      var hasTasks = $("select.trkcurtask option:not('.trknewtasks')").length;
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
        timer.toggle();
      });

      $('.trktimerstart').click(function(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        timer.start();
      });

      $('.trktimerstop').click(function(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        timer.stop(taskMan);
      });

      $('.trktaskpick').on('submit', function(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        taskMan.addTask($('#trknewtask').val(), $('#trkcurtask'));

        // Maybe we should leave it?
        $('#trknewtask').val('');

        $('.trknewtaskgroup').hide();
      });

      /* Helper to make Timer prompt for tasks when first started */
      /* Work around bug in https://github.com/twbs/bootstrap/commit/4b1a6e11326fee97a5ebc194be040086f40f97fb */
      $(document).on('shown.bs.modal', function(ev) {
        if($('.trktaskpick').find('option').length < 2) {
          taskMan.newTaskPrompt();
        }
      });

      $('.trknewtaskgroup').on('keyup', function(ev) {
        if(ev.key === 'Esc') {
          $('.trknewtaskgroup').hide();
        }
      });

    });

  });
})(jQuery);
