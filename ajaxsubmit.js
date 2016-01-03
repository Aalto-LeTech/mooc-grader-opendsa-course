/* TODO write again for mooc-grader */

/******** A+ submissions handling extension stuff ****/
(function ($) {
  // give the JSAV random function the seed from the URL parameter
  var seed = PARAMS.seed || Math.floor(Math.random() * 99999999999999).toString();
  JSAV.utils.rand.seedrandom(seed);
  // override Math.random()
  Math.random = JSAV.utils.rand.random;

  // empty the ODSA log
  localStorage.setItem("event_data", []);
  // events to be logged
  var logEvents = ["odsa-exercise-init"];
  // exercise log array
  var exerciseLog = [];
  $("body").on("jsav-log-event", function(event, eventData) {
    if (logEvents.indexOf(eventData.type) !== -1) {
      console.log(eventData);
      exerciseLog.push(eventData);
    }
  });
  // set ODSA.SETTINGS.MODULE_ORIGIN to *
  ODSA.SETTINGS.MODULE_ORIGIN = "*";

  // change the default grading to "at end"
  var origExercise = JSAV.ext.exercise;
  JSAV.ext.exercise = function(model, reset, options) {
    options = $.extend(options, {feedback: "atend"});
    return origExercise.call(this, model, reset, options);
  };

  // remove help and about buttons
  $("#help").remove();
  $("#about").remove();


  // extend the JSAV translation file used by the interpreter _translate(label)
  var langExtension = {
    en: {
      "A+success": "Your score was successfully submitted to A+.",
      "A+error": "Error submitting your score to A+: ",
      "A+failed": "Failed to submit your solution to A+"
    },
    fi: {
      "A+success": "Pisteesi lähetettiin A+:aan onnistuneesti.",
      "A+error": "Pisteitä lähettäessä tapahtui virhe: ",
      "A+failed": "Ratkaisuasi ei pystytty lähettämään A+:aan"
    }
  };
  $.extend(true, JSAV._translations, langExtension);

  function getAnswerLog(exercise) {
    return exercise._jsondump();
  }

  function getModelLog(exercise) {
    return exercise._jsondump.apply({
      jsav: exercise.modelav,
      initialStructures: exercise.modelStructures
    });
  }

  function getExerciseInput() {
    for (var i = 0; i < exerciseLog.length; i++) {
      var log = exerciseLog[i];
      if (log.type = "odsa-exercise-init") {
        return JSON.stringify(log.desc);
      }
    }
    return "[]";
  }


  var ep = JSAV._types.Exercise.prototype;
  ep.origmodel = ep.showModelanswer;
  ep.origreset = ep.reset;

  ep.showModelanswer = function () {
    var that = this;
    // show spinner
    $('.jsavexercisecontrols').addClass("active");

    if (!PARAMS.model_url && !PARAMS.submit_url) {
      // edX
      window.parent.postMessage(JSON.stringify({
        type: "jsav-model",
        data: {
          seed: seed,
          exercise: ODSA.SETTINGS.AV_NAME,
          log: getAnswerLog(this)
        }}), "*");
      this.origmodel();
      // hide spinner
      $('.jsavexercisecontrols').removeClass("active");
    } else {
      // A+
      // make a post to tell the exercise server that the user wants to see the model answer
      $.ajax(PARAMS.model_url, {
        type: "POST",
        data: {
          answer: getAnswerLog(this),
          log: JSON.stringify(exerciseLog),
          input: getExerciseInput(),
          submission_url: PARAMS.submission_url
        }
      })
      .done(function (data) {
        if (data.status === "OK") {
          that.origmodel();
        } else {
          window.alert(data.message);
        }
        // hide spinner
        $('.jsavexercisecontrols').removeClass("active");
      });
    }
    $('.jsavexercisecontrols input[name="grade"]').attr("disabled", "disabled");
  };

  ep.reset = function () {
    if (!this.initialStructures) {
      // call the original reset function if there are no initial structures
      this.origreset();
    } else if (!PARAMS.reset_url && !PARAMS.submit_url) {
      // edX
      window.parent.postMessage(JSON.stringify({
        type: "jsav-reset",
        data: {
          seed: seed,
          exercise: ODSA.SETTINGS.AV_NAME,
          log: getAnswerLog(this)
        }}), "*");
      window.location.reload();
    } else {
      // A+
      $.get(PARAMS.reset_url, function (data) {
        window.location.href = data;
      });
    }
  };

  ep.showGrade = function () {
    // show spinner
    $('.jsavexercisecontrols').addClass("active");
    this.grade();
    this.jsav.logEvent({type: "jsav-exercise-grade-button", score: $.extend({}, this.score)});
    var trans = this.jsav._translate,
        grade = this.score,
        points = {};

    if (PARAMS.max_points) {
      points.correct = Math.round(grade.correct * parseInt(PARAMS.max_points, 10) / grade.total);
      points.total = parseInt(PARAMS.max_points, 10);
    } else {
      points = grade;
    }

    var msg = trans("yourScore") + " " + points.correct + " / " + points.total + "\n\n";

    if (PARAMS.submit_url) {
      // A+
      $.ajax(PARAMS.submit_url, {
        type: "POST",
        data: {
          answer: getAnswerLog(this),
          model: getModelLog(this),
          input: getExerciseInput(),
          points: grade.correct,
          maximum_points: grade.total,
          submission_url: PARAMS.submission_url,
          log: JSON.stringify(exerciseLog),
          checksum: PARAMS.checksum
        }
      })
      .done(function (data) {
        if (data.status === "OK") {
          msg += trans("A+success");
        } else {
          msg += trans("A+error") + data.message;
        }
        // refresh the points/stats in A+
        window.parent.postMessage({type: "a-plus-refresh-stats"}, "*");
        // setTimeout is used so that we don't block the event loop with our
        // alert. This way the points/stats will be updated "at the same time"
        // as we see the alert
        setTimeout(function () { alert(msg); }, 0);
      })
      .fail(function () {
        alert(trans("A+failed"));
      });
    } else {
      // edX
      window.parent.postMessage(JSON.stringify({
        type: "jsav-submit",
        data: {
          score: grade,
          seed: seed,
          exercise: ODSA.SETTINGS.AV_NAME,
          log: getAnswerLog(this)
        }}), "*");
      alert(msg);
    }
    // hide spinner
    $('.jsavexercisecontrols').removeClass("active");
    // disable grade button
    $('.jsavexercisecontrols input[name="grade"]').attr("disabled", "disabled");
  };

}(jQuery));
