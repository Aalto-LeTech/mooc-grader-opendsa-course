/**
 * Overrides exercises for AJAX submit.
 * Based on work of authors: Ville Karavirta, Samuel Marisa, Kasper Hellström
 */
(function ($) {

  // Random can be seeded from URL.
  var seed = PARAMS.seed || Math.floor(Math.random() * 99999999999999).toString();
  JSAV.utils.rand.seedrandom(seed);
  Math.random = JSAV.utils.rand.random;

  ODSA.SETTINGS.MODULE_ORIGIN = "*";

  // Make harder to find hash secret from minified code.
  var ajax_key = (function(chars) {
    return chars.map(function(i) { return String.fromCharCode(i - 7); }).join('');
  })([ 123, 62, 61, 120, 60, 59, 78, 125 ]);

  // Grade "at end".
  var origExercise = JSAV.ext.exercise;
  JSAV.ext.exercise = function(model, reset, options) {
    options = $.extend(options, {feedback: "atend"});
    return origExercise.call(this, model, reset, options);
  };

  // Remove help and about buttons.
  $("#help").remove();
  $("#about").remove();

  var langExtension = {
    en: {
      "ajaxSuccess": "Your score was successfully recorded.",
      "ajaxError": "Error while submitting your solution: ",
      "ajaxFailed": "Unfortunately recordind your solution failed."
    },
    fi: {
      "ajaxSuccess": "Pisteesi tallennettiin onnistuneesti.",
      "ajaxError": "Ratkaisuasi lähettäessä tapahtui virhe: ",
      "ajaxFailed": "Valitettavasti ratkaisuasi ei pystytty tallentamaan."
    }
  };
  $.extend(true, JSAV._translations, langExtension);

  function getAnswerLog(exercise) {
    // replace call removes non-ascii characters from jsondump
    return exercise._jsondump().replace(/[^\x00-\x7F]/g, "");
  }

  // Override exercise methods.
  var ep = JSAV._types.Exercise.prototype;
  ep.originalModel = ep.showModelanswer;
  ep.originalReset = ep.reset;

  ep.showModelanswer = function() {
    this.modelSeenFlag = true;
    $('.jsavexercisecontrols input[name="grade"]').attr("disabled", "disabled");
    this.originalModel();
  };

  ep.reset = function() {
    this.originalReset();
    delete this.modelSeenFlag;
    $('.jsavexercisecontrols input[name="grade"]').removeAttr("disabled");
  };

  ep.showGrade = function () {
    if (this.modelSeenFlag) {
      return;
    }
    $('.jsavexercisecontrols').addClass("active");
    $('.jsavexercisecontrols input[name="grade"]').attr("disabled", "disabled");

    this.grade();
    this.jsav.logEvent({type: "jsav-exercise-grade-button", score: $.extend({}, this.score)});
    var trans = this.jsav._translate,
        answer = getAnswerLog(this),
        grade = this.score;

    var check = [PARAMS.submission_url,answer,grade.correct,grade.total].join(':');
    var msg = trans("yourScore") + " " + grade.correct + " / " + grade.total + "\n\n";

    $.ajax(PARAMS.submit_url, {
      type: "POST",
      data: {
        checksum: md5(ajax_key + check),
        submission_url: PARAMS.submission_url,
        answer: answer,
        points: grade.correct,
        max_points: grade.total
      }
    })
    .done(function (data) {
      if (data.success) {
        msg += trans("ajaxSuccess");
      } else {
        msg += trans("ajaxError") + data.message;
      }

      // Ask to refresh exercise info in A+.
      window.parent.postMessage({type: "a-plus-refresh-stats"}, "*");

      // setTimeout is used so that we don't block the event loop with our
      // alert. This way the points/stats will be updated "at the same time"
      // as we see the alert.
      setTimeout(function () { alert(msg); }, 0);
    })
    .fail(function () {
      alert(trans("ajaxFailed"));
    });

    $('.jsavexercisecontrols').removeClass("active");
  };

}(jQuery));
