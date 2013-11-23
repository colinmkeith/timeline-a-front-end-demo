jQuery.noConflict();
(function($) {

  var trkTimer = function() {
    this.taskCounter = 0;
    this.anonTask = function() {
      return 'task' + (this.taskCounter++);
    };

    this.start = function() {
      this.startTime = new Date().getTime();
      this.timer();
      $('.trkindicator').addClass('trkindicator-animate');
      $('.trkdd').val('0d');
      $('.trkhm').val('00:00');
      $('.trkss').val('0s');
    };

    this.stop = function() {
      if(this.timeHdl) {
        clearInterval(this.timeHdl);
      }
      $('.trkindicator').css({transform : $('.trkindicator').css('transform') });
      $('.trkindicator').removeClass('trkindicator-animate');

      var stopTime = new Date().getTime();
      return this.startTime - stopTime;
    };

    this.updateTime = function() {
      var elapsedTime = this.startTime - new Date().getTime();
      elapsedTime /= 1000;
      var ss = 60 * (parseInt(elapsedTime / 60, 10) - (elapsedTime / 60));
      console.log(ss);
      $('.trkss').val(ss);
    };

    this.timer = function() {
      var func = this.updateTime;
      var scope = this;
      this.timeHdl = setInterval(function() { func.apply(scope); }, 1000);
    };
  };

  /*
     $.fn.timer = function(action) {

     switch(action) {
     case 'stop':
// this.tasks[this.currentTask]
// this.Time = new Date().getTime();
break;
case 'start':
break;
case 'toggle':
break;
}

console.log($.fn.timer.anonTask());

return this;
};
   */

$(function() {
  jQuery(document).ready(function($) {
    var timer = new trkTimer();

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
      timer.stop();
    });

  });

});
})(jQuery);
