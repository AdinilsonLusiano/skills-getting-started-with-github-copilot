document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message and dropdown (keep default placeholder)
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants section (no bullets, with delete icon)
        let participantsHtml = `<div class="participants"><strong>Participants</strong>`;
        if (details.participants.length === 0) {
          participantsHtml += `<p class="no-participants">Nenhum inscrito ainda</p>`;
        } else {
          participantsHtml += `<ul class="participants-list no-bullets">` + details.participants.map(p => `
            <li class="participant-item" data-activity="${name}" data-email="${p}">
              <span class="participant-name">${p}</span>
              <span class="delete-icon" title="Remover participante">&#128465;</span>
            </li>`).join("") + `</ul>`;
        }
        participantsHtml += `</div>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;


        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        // show success message
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();

        // Refresh activities so participants list updates
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });


  // Event delegation para remover participante
  document.addEventListener("click", async (event) => {
    if (event.target.classList.contains("delete-icon")) {
      const li = event.target.closest(".participant-item");
      if (!li) return;
      const activity = li.getAttribute("data-activity");
      const email = li.getAttribute("data-email");
      if (!activity || !email) return;
      if (!confirm(`Remover participante ${email} da atividade ${activity}?`)) return;
      try {
        const response = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, {
          method: "POST"
        });
        const result = await response.json();
        if (response.ok) {
          messageDiv.textContent = result.message || "Participante removido.";
          messageDiv.className = "message success";
          fetchActivities();
        } else {
          messageDiv.textContent = result.detail || "Erro ao remover participante.";
          messageDiv.className = "message error";
        }
        messageDiv.classList.remove("hidden");
        setTimeout(() => {
          messageDiv.classList.add("hidden");
        }, 5000);
      } catch (error) {
        messageDiv.textContent = "Falha ao remover participante.";
        messageDiv.className = "message error";
        messageDiv.classList.remove("hidden");
        setTimeout(() => {
          messageDiv.classList.add("hidden");
        }, 5000);
      }
    }
  });

  // Initialize app
  fetchActivities();
});
