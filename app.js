(function () {
  "use strict";

  var TRIAGE_DELAY_MS = 1500;

  var CATEGORY_LABELS = {
    hardware: "Hardware",
    software: "Software",
    network: "Network",
    account: "Account Access"
  };

  var CATEGORY_QUEUES = {
    hardware: "Onsite Support",
    software: "Applications",
    network: "Infrastructure",
    account: "Identity"
  };

  var CATEGORY_PREFIXES = {
    hardware: "HW",
    software: "SW",
    network: "NET",
    account: "ACC"
  };

  var SLA_HOURS = {
    High: 4,
    Medium: 8,
    Low: 24
  };

  var nextReference = 1042;

  function byId(id) {
    return document.getElementById(id);
  }

  function isWholeNumber(value) {
    return /^\d+$/.test(value);
  }

  function validate(values) {
    var errors = {};

    if (values.requesterId === "") {
      errors.requesterId = "Requester ID is required.";
    } else if (!/^s\d{7}$/.test(values.requesterId)) {
      errors.requesterId = "Requester ID must be the letter s followed by seven digits.";
    }

    if (values.email === "") {
      errors.email = "Email address is required.";
    } else if (!/@rmit\.edu\.vn$/i.test(values.email)) {
      errors.email = "Email address must end with @rmit.edu.vn.";
    }

    if (values.category === "") {
      errors.category = "Select a category.";
    }

    if (values.impact === "") {
      errors.impact = "Impact score is required.";
    } else if (!isWholeNumber(values.impact) || Number(values.impact) < 1 || Number(values.impact) > 10) {
      errors.impact = "Impact score must be a whole number between 1 and 10.";
    }

    if (values.affectedUsers === "") {
      errors.affectedUsers = "Number of affected users is required.";
    } else if (!isWholeNumber(values.affectedUsers) || Number(values.affectedUsers) < 1 || Number(values.affectedUsers) >= 500) {
      errors.affectedUsers = "Number of affected users must be a whole number between 1 and 500.";
    }

    if (values.description === "") {
      errors.description = "Description is required.";
    } else if (values.description.length < 20) {
      errors.description = "Description must be at least 20 characters.";
    }

    return errors;
  }

  function basePriority(impact) {
    if (impact >= 8) {
      return "High";
    }
    if (impact >= 4) {
      return "Medium";
    }
    return "Low";
  }

  function applyEscalation(priority, outage, affectedUsers) {
    if (!outage) {
      return priority;
    }
    if (priority === "Low") {
      return "Medium";
    }
    if (priority === "Medium") {
      return "High";
    }
    return "High";
  }

  function buildReference(category) {
    var reference = CATEGORY_PREFIXES[category] + "-" + nextReference;
    nextReference = nextReference + 1;
    return reference;
  }

  function readValues() {
    return {
      requesterId: byId("requesterId").value.trim(),
      email: byId("email").value.trim(),
      category: byId("category").value,
      impact: byId("impact").value.trim(),
      affectedUsers: byId("affectedUsers").value.trim(),
      description: byId("description").value.trim(),
      outage: byId("outage").checked
    };
  }

  function clearErrors() {
    var messages = document.querySelectorAll(".field-error");
    var i;
    for (i = 0; i < messages.length; i = i + 1) {
      messages[i].textContent = "";
      messages[i].classList.add("hidden");
    }
  }

  function showErrors(errors) {
    var field;
    for (field in errors) {
      if (Object.prototype.hasOwnProperty.call(errors, field)) {
        var target = byId("err-" + field);
        target.textContent = errors[field];
        target.classList.remove("hidden");
      }
    }
  }

  function addQueueRow(reference, category, priority, affectedUsers) {
    var tbody = document.querySelector("#ticketTable tbody");
    var row = document.createElement("tr");
    row.innerHTML =
      '<td class="cell-ref">' + reference + "</td>" +
      '<td class="cell-category">' + CATEGORY_LABELS[category] + "</td>" +
      '<td class="cell-priority">' + priority + "</td>" +
      '<td class="cell-users">' + affectedUsers + "</td>" +
      '<td class="cell-status">Open</td>';
    tbody.insertBefore(row, tbody.firstChild);
  }

  function showResult(values) {
    var impact = Number(values.impact);
    var affectedUsers = Number(values.affectedUsers);
    var base = basePriority(impact);
    var finalPriority = applyEscalation(base, values.outage, affectedUsers);
    var reference = buildReference(values.category);

    byId("ticketRef").textContent = reference;
    byId("priorityValue").innerHTML =
      '<span class="badge badge-' + finalPriority.toLowerCase() + '">' + finalPriority + "</span>";
    byId("slaValue").textContent = "Respond within " + SLA_HOURS[finalPriority] + " hours";
    document.querySelector(".queue-name").textContent = CATEGORY_QUEUES[values.category];

    addQueueRow(reference, values.category, base, affectedUsers);

    byId("resultPanel").classList.remove("hidden");
  }

  function handleSubmit(event) {
    event.preventDefault();

    clearErrors();
    byId("resultPanel").classList.add("hidden");
    byId("spinner").classList.add("hidden");

    var values = readValues();
    var errors = validate(values);

    var hasErrors = false;
    var key;
    for (key in errors) {
      if (Object.prototype.hasOwnProperty.call(errors, key)) {
        hasErrors = true;
      }
    }

    if (hasErrors) {
      showErrors(errors);
      return;
    }

    byId("spinner").classList.remove("hidden");
    byId("triageBtn").disabled = true;

    window.setTimeout(function () {
      byId("spinner").classList.add("hidden");
      byId("triageBtn").disabled = false;
      showResult(values);
    }, TRIAGE_DELAY_MS);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = byId("ticketForm");
    if (form) {
      form.addEventListener("submit", handleSubmit);
    }
  });
}());