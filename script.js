jQuery.noConflict();
(function($) {
  $(function() {

    var trkTaskManager = function() {
      this.tasks = [];

      this.newTaskPrompt = function(ev) {
        var srcEl = $(ev.target);
        ev.preventDefault();
        ev.stopPropagation();
        $('.trknewtaskgroup').show();
        $('#trknewtask').focus();
      };

      this.addTask = function(taskName, selectEl) {
        if($.inArray(taskName, this.tasks) !== -1) {
          return 0;
        }

        this.tasks.push(taskName);
        selectEl.append($('<option>', {
          value : taskName,
          text  : taskName
        })).removeAttr('disabled')
           .find('option').last()[0].selected = true;
      };

    };

    var trkTimer = function() {
      this.ANIMATE_CLASS = 'trkindicator-animate';
      this.isRunning = 0;

      this.start = function() {
        if(this.isRunning) {
          return;
        }

        this.isRunning = 1;
        this.startTime = new Date().getTime();
        this.timer();
        $('.trkindicator').addClass(this.ANIMATE_CLASS);
        $('.trkdd').text('0d');
        $('.trkhm').text('00:00');
        $('.trkss').text('0s');
      };

      this.stop = function() {
        this.isRunning = 0;
        if(this.timeHdl) {
          clearInterval(this.timeHdl);
        }
        $('.trkindicator').css({transform : $('.trkindicator').css('transform') });
        $('.trkindicator').removeClass(this.ANIMATE_CLASS);

        var stopTime = new Date().getTime();
        return this.startTime - stopTime;
      };

      this.updateTime = function() {
        var elapsedTime = new Date().getTime() - this.startTime;
        elapsedTime /= 1000;
        var ss = parseInt(60 * ((elapsedTime / 60) - parseInt(elapsedTime / 60, 10)));
        $('.trkss').text(ss);
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
      var taskMan  = new trkTaskManager();
/* DEBUG */
window.taskMan = taskMan;
window.timer   = timer;
      $('.trkcurtask').on('click keyup', function(ev) {
        console.log(ev);
        var targ = ev.target;
        if(targ) {
          if(targ.nodeName === 'SELECT') {
            if(targ.options.length === 1 ||
              (ev.type === 'keyup' && ev.keyCode === 13 && $(targ).val() === '#new')) {
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
        timer.stop($('.trktaskpick').val());
      });

      $('.trktaskpick').on('submit', function(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        taskMan.addTask($('#trknewtask').val(), $('#trkcurtask'));

        // Maybe we should leave it?
        $('#trknewtask').val('');

        $('.trknewtaskgroup').hide();
      });

    });

  });
})(jQuery);
