function updateStatus(status, message = "") {
  const statusArea = document.getElementById("status-area");
  const statusMessage = document.getElementById("status-message");
  const baseClassList = "w-full p-2 text-center text-white font-bold ";

  switch (status) {
    case "success":
      statusArea.className = baseClassList + "bg-green-500";
      statusMessage.textContent = "Success!";
      break;
    case "loading":
      statusArea.className = baseClassList + "bg-yellow-500";
      statusMessage.textContent = "Loading...";
      break;
    case "error-retry":
      statusArea.className = baseClassList + "bg-red-500";
      statusMessage.textContent = "Ooops! an error occurred, but hold tight the app will automatically try again.";
      break;
    case "error":
      statusArea.className = baseClassList + "bg-red-500";
      statusMessage.textContent = "Ooops! there was an error, you might want to try again later or contact support.";
      if (message) {
        console.log("@updateStatus --- case: error --- message =", message);
        statusMessage.textContent = "Ooops! there was an error, " + message;
      }
      console.log("@updateStatus --- case: error --- statusMessage.textContent =", statusMessage.textContent);
      break;
    default:
      statusArea.className = baseClassList + "bg-blue-400";
      statusMessage.textContent = "Unknown Status";
  }
}
// Function to send a fetch request
function fetchData(url) {
  // Update the status to 'loading'
  updateStatus("loading");

  fetch(url)
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      throw new Error("Network response was not ok.");
    })
    .then((data) => {
      // Handle the data
      displayData(data);
      // Update the status to 'success'
      updateStatus("success");
    })
    .catch((error) => {
      console.error("There has been a problem with your fetch operation:", error);
      // Update the status to 'error'
      updateStatus("error");
    });
}

// Function to display data
function displayData(data) {
  const dataDisplay = document.getElementById("data-display");
  // Assuming data is an object, iterate over its properties to display them
  dataDisplay.textContent = JSON.stringify(data, null, 2);
}

// Function to handle link click and fetch data
function handleLinkClick(event) {
  event.preventDefault(); // Prevent the default anchor tag behavior

  const url = event.currentTarget.getAttribute("href");
  setButtonsDisabled(true); // Disable all the buttons before fetching
  updateStatus("loading");
  const linkText = event.currentTarget.textContent; // or use innerText

  console.log("Link was clicked:", linkText);
  setTimeout(() => {
    updateStatus("success");
    setButtonsDisabled(false);
  }, 2000);

  //   fetch(url)
  //     .then((response) => {
  //       if (!response.ok) {
  //         // Check for 401 Unauthorized specifically
  //         if (response.status === 401) {
  //           updateStatus("error-retry");
  //           // Optionally, implement retry logic here
  //         } else {
  //           updateStatus("error");
  //         }
  //         throw new Error("Network response was not ok.");
  //       }
  //       return response.json();
  //     })
  //     .then((data) => {
  //       // Handle the data
  //       displayData(data);
  //       updateStatus("success");
  //     })
  //     .catch((error) => {
  //       console.error("Fetch error:", error);
  //       updateStatus("error");
  //     })
  //     .finally(() => {
  //       setButtonsDisabled(false); // Re-enable the buttons after fetching
  //     });
}

function stopDefault(event) {
  event.preventDefault();
  event.stopPropagation();
}

// Function to enable/disable all the control links
function setButtonsDisabled(disabled) {
  const buttons = document.querySelectorAll(".control-button");
  const links = document.querySelectorAll(".control-link");
  buttons.forEach((button) => {
    button.classList.toggle("opacity-50", disabled);
    button.classList.toggle("cursor-not-allowed", disabled);
    if (disabled) {
      button.addEventListener("click", stopDefault);
    } else {
      button.removeEventListener("click", stopDefault);
    }
  });
  links.forEach((link) => {
    // console.log("@setButtonsDisabled --- will disable link --- disabled =", disabled);
    if (disabled) {
      // console.log("@setButtonsDisabled --- will remove event listener from link");
      link.removeEventListener("click", handleLinkClick);
    } else {
      // console.log("@setButtonsDisabled --- will add event listener to link");
      link.addEventListener("click", handleLinkClick);
    }
  });
}

document.getElementById("random-users").addEventListener("submit", function (event) {
  event.preventDefault();
  const numberInput = document.getElementById("random-users-number_input");
  const formData = new FormData(this);
  // console.log("@random-users submission handler ---- formData:");
  // for (const pair of formData.entries()) {
  //   console.log(pair[0] + ", " + pair[1]);
  // }
  setButtonsDisabled(true);
  updateStatus("loading");
  numberInput.value = "";

  fetch("http://127.0.0.1:5000/random-users", {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      // if response 200 ok => show success status, populate data-display with html generated from response, clear all input fields
      if (!response.ok) {
        // console.log("response not ok");
        return response.text().then((err) => {
          console.log(err);
          throw new Error(err);
        });
      }
      return response.json();
    })
    .then(({ users, newListName }) => {
      console.log("@then 2 handler --- response:", newListName);
      console.log("@then 2 handler --- response:", users);
      // display list name in the list name area
      changeListName(newListName);
      populateTable(users);
      updateStatus("success");
      setButtonsDisabled(false);
    })
    .catch((error) => {
      // display error status
      updateStatus("error", error.message);
      setButtonsDisabled(false);
    });
});

// Add event listeners to the control links
document.addEventListener("DOMContentLoaded", () => {
  // const links = document.querySelectorAll(".control-link");
  // console.log("links:", links.length);
  // links.forEach((link) => {
  //   console.log("will add event listener to link");
  //   link.addEventListener("click", handleLinkClick);
  // });
  // console.log("will disable buttons");
  setButtonsDisabled(false); // Initially enable all the buttons
  updateStatus();
});

function changeListName(newListName) {
  const listName = document.getElementById("list-name");
  listName.innerHTML = newListName;
}

function populateTable(usersData) {
  const tableBody = document.getElementById("tableBody");
  tableBody.innerHTML = "";
  usersData.forEach((user) => {
    const row = document.createElement("tr");
    row.id = user.name + "-" + user.id;
    const tdWithClass1 = '<td class="px-2 py-2 text-left text-xs font-medium text-gray-500 tracking-wider bg-green-50">';
    const tdWithClass2 = '<td class="px-2 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">';
    row.innerHTML = `
    ${tdWithClass1}${user.email}</td>
    ${tdWithClass1}${user.phone_number}</td>
    ${tdWithClass2}${user.name}</td>
    ${tdWithClass2}${user.city}</td>
    ${tdWithClass2}${user.id}</td>
    ${tdWithClass2}${user.notes}</td>
  `;
    tableBody.appendChild(row);
  });
}

const editButton = document.getElementById("list-name-edit-button");
const listNameArea = document.getElementById("list-name-area");
const listName = document.getElementById("list-name");

editButton.addEventListener("click", () => {
  const isEditing = listNameArea.contains(document.querySelector("input#list-name-input"));

  if (!isEditing) {
    // Change the heading into an input field
    const input = document.createElement("input");
    input.type = "text";
    input.id = "list-name-input";
    input.className = "text-lg font-bold text-center";
    input.value = listName.textContent;
    listNameArea.replaceChild(input, listName);

    // Change the edit icon to a save icon
    editButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4">
          <path fill-rule="evenodd" d="M17.707 2.293a1 1 0 010 1.414l-12 12a1 1 0 01-.707.293H3a1 1 0 01-1-1v-3.586a1 1 0 01.293-.707l12-12a1 1 0 011.414 0z" clip-rule="evenodd" />
          <path fill-rule="evenodd" d="M12.293 2.707a1 1 0 011.414 0l3.586 3.586a1 1 0 010 1.414l-1 1a1 1 0 01-1.414-1.414l.293-.293-1.586-1.586-1.414 1.414 1.586 1.586-.293.293a1 1 0 01-1.414 0l-1-1a1 1 0 010-1.414l1-1a1 1 0 011.414 1.414L15.414 8 14 6.586 12.293 7.293a1 1 0 000 1.414z" clip-rule="evenodd" />
        </svg>
      `;

    // Focus the input and select its content
    input.focus();
    input.select();
  } else {
    // Save the new name when clicking the save button
    const inputValue = document.querySelector("input#list-name-input").value;
    // send request to the backend to save the new list name and wait for the response
    // if the name is ok, replace the old name with the new one
    // if name is already used the response will contain an error message and the old name will be displayed
    listName.textContent = inputValue;

    // Replace the input with the updated heading
    listNameArea.replaceChild(listName, document.querySelector("input#list-name-input"));

    // Change the save icon back to the edit icon
    editButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="h-4 w-4">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
      `;

    // Now send a request to the backend to save the new list name
    // Replace `yourEndpointURL` with the actual URL of your backend endpoint
    fetch("yourEndpointURL", {
      method: "POST", // or 'PUT' depending on your backend
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ listName: inputValue }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Success:", data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }
});
