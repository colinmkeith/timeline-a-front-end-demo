jQuery.noConflict();
(function($) {
  $(function() {

    var trkTimer = function() {
      this.ANIMATE_CLASS = 'trkindicator-animate';
      this.isRunning = 0;
      this.taskCounter = 0;
      this.anonTask = function() {
        return 'task' + (this.taskCounter++);
      };

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

      this.newTask = function(ev) {
        var srcEl = $(ev.target);
        ev.preventDefault();
        ev.stopPropagation();
        (function(srcEl) {
          setTimeout(function() { srcEl.select2('close'); }, 100);
        })(srcEl);
        $('.trknewtaskgroup').show();
        $('#trknewtask').focus();
      };
    };

    $(document).ready(function($) {
      var hasTasks = $("select.trkcurtask option:not('.trknewtasks')").length;
      var timer = new trkTimer();

      $('.trkcurtask').select2({
        width       : '240px',
        placeholder : 'Select Task'
      })
      .on('select2-selecting', function(ev) {
        if(e.val === '#new') {
          timer.newTask(ev);
        }
      })
      .on('select2-focus', function(ev) {
        var srcEl = $(ev.target);
        var options = srcEl.select2('data').element;
        if(options.length < 2) {
          timer.newTask(ev);
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
        timer.stop($('.trktaskpick').select2().value);
      });
    });

  });
})(jQuery);
