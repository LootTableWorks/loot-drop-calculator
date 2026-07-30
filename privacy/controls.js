(function () {
  "use strict";

  var status = document.getElementById("metrics-status");
  var disable = document.getElementById("disable-metrics");
  var enable = document.getElementById("enable-metrics");

  function optedOut() {
    try {
      return localStorage.getItem("ltw_metrics_opt_out") === "1";
    } catch (_error) {
      return true;
    }
  }

  function render() {
    status.textContent = optedOut()
      ? "This browser is excluded from Loot Table Works measurement."
      : "This browser currently allows aggregate Loot Table Works measurement.";
  }

  disable.addEventListener("click", function () {
    try {
      localStorage.setItem("ltw_metrics_opt_out", "1");
    } catch (_error) {
      status.textContent = "This browser did not allow the preference to be stored.";
      return;
    }
    render();
  });

  enable.addEventListener("click", function () {
    try {
      localStorage.removeItem("ltw_metrics_opt_out");
    } catch (_error) {
      status.textContent = "This browser did not allow the preference to be changed.";
      return;
    }
    render();
  });

  render();
})();
