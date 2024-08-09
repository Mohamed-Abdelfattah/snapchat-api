function createReactiveState(initialReactiveState) {
  const listeners = new Set();
  const reactiveState = new Proxy(initialReactiveState, {
    set(target, key, value) {
      target[key] = value;
      console.log("@reactiveState trap --- key:", key, "was set to value:", value);
      listeners.forEach((listener) => {
        console.log("@reactiveState trap --- will run listener --- listener:", listener);
        listener();
      });
      return true;
    },
  });
  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
  return { reactiveState, subscribe };
}
/**
 * @typedef {Object} User |
 * @property {string} name
 * @property {number} id
 * @property {number} age
 * @property {string} email
 * @property {string} phone_number
 * @property {string} city
 * @property {string} notes
 * */
/**
 * @typedef {Object} ReactiveState
 * @property {boolean} isNewSegment
 */
/**
 * @typedef {Object} PassiveState
 * @property {{name: string, id:string, users: User[], oldName:string} | null } editedSegment
 * @property {{name: string, id:string, users: User[]} | null } activeSegment
 * @property {string[] | null } segments
 * */

/**
 * @type {{reactiveState:ReactiveState}} */
const { reactiveState, subscribe } = createReactiveState({ isNewSegment: false });
/**@type {PassiveState} */
const state = {
  activeSegment: null,
  editedSegment: null,
  segments: null,
};

console.log("@app.js --- state:", reactiveState);
subscribe(function toggleSaveButtonText() {
  const button = document.getElementById("save-button");
  button.textContent = reactiveState.isNewSegment ? "Save New Segment" : "Save Changes";
});

function updateStatus(status, message = "") {
  const statusArea = document.getElementById("status-area");
  const statusMessage = document.getElementById("status-message");
  const baseClassList = "w-full p-2 text-center text-white font-bold ";
  // used innerText instead of textContent as the later doesn't render new lines within message
  switch (status) {
    case "success":
      statusArea.className = baseClassList + "bg-green-500";
      statusMessage.innerText = "Success!";
      if (message) {
        console.log("@updateStatus --- case: success --- message =", message);
        statusMessage.innerText = "Success!\n" + message;
      }
      break;
    case "loading":
      statusArea.className = baseClassList + "bg-yellow-500";
      statusMessage.innerText = "Loading...";
      break;
    case "updates":
      statusArea.className = baseClassList + "bg-yellow-500";
      statusMessage.innerText = message || "processing...";
      break;
    case "error-retry":
      statusArea.className = baseClassList + "bg-red-500";
      statusMessage.innerText = "Ooops! an error occurred, but hold tight the app will automatically try again.";
      break;
    case "error":
      statusArea.className = baseClassList + "bg-red-500";
      statusMessage.innerText = "Ooops! there was an error, you might want to try again later or contact support.";
      if (message) {
        console.log("@updateStatus --- case: error --- message =", message);
        statusMessage.innerText = "Ooops! there was an error, " + message;
      }
      console.log("@updateStatus --- case: error --- statusMessage.innerText =", statusMessage.innerText);
      break;
    default:
      statusArea.className = baseClassList + "bg-blue-400";
      statusMessage.innerText = "Unknown Status";
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
  stopDefault(event);

  const url = event.currentTarget.getAttribute("href");
  setButtonsDisabled({ disabled: true, allButtons: true }); // Disable all the buttons before fetching
  updateStatus("loading");
  const linkText = event.currentTarget.textContent; // or use innerText
  console.log("@handleLinkClick ----- Link was clicked:", linkText);
  console.log("@handleLinkClick ----- url:", url);
  // setTimeout(() => {
  //   updateStatus("success");
  //   setButtonsDisabled({ disabled: false, allButtons: true });
  // }, 2000);

  fetch(url)
    .then((response) => {
      if (!response.ok) {
        // Check for 401 Unauthorized specifically
        if (response.status === 401) {
          updateStatus("error-retry");
          // Optionally, implement retry logic here
        } else {
          updateStatus("error");
        }
        throw new Error("Network response was not ok.");
      }
      return response.json();
    })
    .then((data) => {
      // Handle the data
      // displayData(data);
      console.log("@handleLinkClick ----- data:", data);
      updateStatus("success");
    })
    .catch((error) => {
      console.error("Fetch error:", error);
      updateStatus("error");
    })
    .finally(() => {
      setButtonsDisabled({ disabled: false, allButtons: true }); // Re-enable the buttons after fetching
    });
}

function stopDefault(event) {
  event.preventDefault();
  event.stopPropagation();
}

// Function to enable/disable specified buttons or links, or all if allButtons is true
function setButtonsDisabled({ disabled = false, allButtons = false, elementIds = [] } = {}) {
  // Select buttonsLike based on `allButtons` flag and provided IDs
  const buttonsLike = allButtons ? document.querySelectorAll(".control-button") : elementIds.map((id) => document.getElementById(id));
  const links = document.querySelectorAll(".control-link");

  buttonsLike.forEach((element) => {
    if (!element) return; // Skip if element is not found by ID
    element.classList.toggle("opacity-50", disabled);
    element.classList.toggle("cursor-not-allowed", disabled);
    if (disabled) {
      element.addEventListener("click", stopDefault);
    } else {
      element.removeEventListener("click", stopDefault);
    }
  });
  if (allButtons) {
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
}
// // Function to enable/disable all the control links
// function setButtonsDisabled(disabled) {
//   const buttons = document.querySelectorAll(".control-button");
//   const links = document.querySelectorAll(".control-link");
//   buttons.forEach((button) => {
//     button.classList.toggle("opacity-50", disabled);
//     button.classList.toggle("cursor-not-allowed", disabled);
//     if (disabled) {
//       button.addEventListener("click", stopDefault);
//     } else {
//       button.removeEventListener("click", stopDefault);
//     }
//   });
//   links.forEach((link) => {
//     // console.log("@setButtonsDisabled --- will disable link --- disabled =", disabled);
//     if (disabled) {
//       // console.log("@setButtonsDisabled --- will remove event listener from link");
//       link.removeEventListener("click", handleLinkClick);
//     } else {
//       // console.log("@setButtonsDisabled --- will add event listener to link");
//       link.addEventListener("click", handleLinkClick);
//     }
//   });
// }

document.getElementById("load-segment-form").addEventListener("submit", function (event) {
  stopDefault(event);
  const choice = dropdownSelect.options[dropdownSelect.selectedIndex];
  const data = JSON.parse(choice.dataset.info);
  console.log("@load-segment-form submission handler ---- data:", data.segmentId, data.segmentName);
  // fetch data and update ui sequence
  setButtonsDisabled({ disabled: true, allButtons: true });
  updateStatus("loading");
  /// TODO: disable interactions with table and apply loading overlay
  fetch(`http://127.0.0.1:5000/segments/${data.segmentId}?name=${data.segmentName}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok.");
      }
      return response.json();
    })
    .then((data) => {
      console.log("@load-segment-form submission handler ---- data:", data);
      displayData(data);
      updateStatus("success");
    })
    .catch((error) => {
      console.error("Fetch error:", error);
      updateStatus("error", error);
    })
    .finally(() => {
      setButtonsDisabled({ disabled: false, allButtons: true });
    });
});

document.getElementById("random-users").addEventListener("submit", function (event) {
  event.preventDefault();
  const numberInput = document.getElementById("random-users-number_input");
  const formData = new FormData(this);
  setButtonsDisabled({ disabled: true, allButtons: true });
  updateStatus("loading");
  numberInput.value = "";

  fetch("http://127.0.0.1:5000/generate-random-list", {
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
    .then(({ users, newSegmentName }) => {
      const [listNameToBeViewed, listId] = newSegmentName.split(" +++ ");
      console.log("@then 2 handler --- response:", newSegmentName);
      console.log("@then 2 handler --- response:", users);
      console.log("@then 2 handler --- listName:", listNameToBeViewed, " --- listId:", listId);
      // update state
      state.activeSegment = { name: listNameToBeViewed, id: listId, users: users };
      state.editedSegment = { name: listNameToBeViewed, users: users, oldName: listNameToBeViewed };
      reactiveState.isNewSegment = true;
      // update UI
      changeListName(listNameToBeViewed);
      populateTable(users);
      updateStatus("success");
      setButtonsDisabled({ disabled: false, allButtons: true });
      setButtonsDisabled({ disabled: true, elementIds: ["edit-list-button"] });
    })
    .catch((error) => {
      // display error status
      updateStatus("error", error.message);
      setButtonsDisabled({ disabled: false, allButtons: true });
    });
});

// save button handler
document.getElementById("save-button").addEventListener("click", (event) => {
  stopDefault(event);
  setButtonsDisabled({ disabled: true, allButtons: true });
  // TODO: disable interactions with table and apply loading overlay
  updateStatus("loading");
  let url;
  let options;
  if (reactiveState.isNewSegment) {
    // handle case of creating a new list
    url = "http://127.0.0.1:5000/segments";
    options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(state.editedSegment),
    };
  } else {
    // handle case of editing an existing list
    url = `http://127.0.0.1:5000/segments/${state.activeSegment.id}`;
    options = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(state.editedSegment),
    };
  }
  // send request to the backend
  fetch(url, options)
    .then((response) => {
      // Check if the response is OK
      if (!response.ok) {
        return response.json().then((response) => {
          console.log("response not ok ==>\n", response);
          throw new Error(`Network response was not ok \n ${response.error}`);
        });
      }
      // Return the ReadableStream from the response
      return response.body.getReader();
    })
    .then((reader) => {
      const decoder = new TextDecoder("utf-8");
      // Function to read the stream
      function read() {
        return reader.read().then(({ done, value }) => {
          if (done) {
            return;
          }
          // Decode the stream value to a text
          const text = decoder.decode(value);
          // check for errors
          if (text.startsWith("error:")) {
            console.log("@read handler --- error ==>", text);
            throw new Error(text.substring(6).trim()); // Remove "error: " prefix
          }
          // display the status update
          updateStatus("updates", text.substring(5).trim());
          console.log("@read handler --- text:", text.trim());
          // Check if the processing is completed
          if (text.includes("completed")) {
            updateStatus("success");
            // setButtonsDisabled({ disabled: false, allButtons: true });
            reader.cancel(); // Close the connection if processing is completed
            // throw new Error("Network response was not ok");
          } else {
            return read(); // Continue reading
          }
        });
      }
      console.log("read called");
      return read();
    })
    .catch((error) => {
      updateStatus("error", error.message);
      // setButtonsDisabled({ disabled: false, allButtons: true });
    })
    .finally(() => {
      console.log("finally called");
      setButtonsDisabled({ disabled: false, allButtons: true });
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
  // Initially enable all the buttons except for the buttons for lists editing/actions
  setButtonsDisabled({ disabled: false, allButtons: true });
  setButtonsDisabled({ disabled: true, elementIds: ["edit-button", "save-button"] });
  updateStatus();
});

// const dropdownButton = document.getElementById("dropdownButton");
// const dropdownMenu = document.getElementById("dropdownMenu");
// console.log("dropdownMenu:", dropdownMenu);

// // Toggle dropdown menu visibility on button click
// dropdownButton.addEventListener("click", () => {
//   dropdownMenu.classList.toggle("hidden");

//   // Fetch the data from the backend and populate the dropdown menu
//   fetch("/segments")
//     .then((response) => response.json())
//     .then((data) => {
//       console.log("data:", data);
//       populateDropdownMenu(data);
//     })
//     .catch((error) => console.error("Error fetching segments:", error));
// });

// function populateDropdownMenu(options) {
//   const optionsMenu = document.getElementById("dropdownMenu").querySelector("div[role='menu']");
//   console.log("optionsMenu:", optionsMenu);
//   optionsMenu.innerHTML = ""; // Clear existing options

//   options.forEach((option) => {
//     const optionElement = document.createElement("a");
//     optionElement.href = "segment/" + option.segmentId;
//     optionElement.className = "block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100";
//     optionElement.role = "menuitem";
//     optionElement.textContent = option.segmentName;
//     optionElement.addEventListener("click", handleLinkClick);
//     optionsMenu.appendChild(optionElement);
//   });
// }

const dropdownSelect = document.getElementById("segments-menu");
const openButton = document.getElementById("open-button");

dropdownSelect.addEventListener(
  "change",
  function () {
    this.classList.remove("text-gray-500");
    this.classList.add("text-black");
    setButtonsDisabled({ disabled: false, elementIds: ["open-button"] });
  },
  { once: true }
);

// Fetch the data from the backend and populate the dropdown select
fetch("/segments")
  .then((response) => response.json())
  .then((data) => {
    console.log("data:", data);
    populateDropdownSelect(data);
  })
  .catch((error) => console.error("Error fetching segments:", error))
  .finally(() => {
    setButtonsDisabled({ disabled: true, elementIds: ["open-button"] });
  });

function populateDropdownSelect(items) {
  items.forEach((item) => {
    const optionElement = document.createElement("option");
    optionElement.value = item.segmentId; // Assuming the option object has a 'segmentId' property
    optionElement.textContent = item.segmentName; // Assuming the option object has a 'segmentName' property
    optionElement.dataset.info = JSON.stringify(item);
    optionElement.className = "text-black";
    optionElement.addEventListener("click", handleLinkClick);
    dropdownSelect.appendChild(optionElement);
  });
}

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
    input.className = "text-lg font-bold py-2 text-center";
    input.value = listName.textContent;
    listNameArea.replaceChild(input, listName);

    // Change the edit icon to a save icon
    editButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="h-4 w-4">
        <path 
        fill="currentColor" 
        fill-rule="evenodd" 
        clip-rule="evenodd" 
        d="M18.1716 1C18.702 1 19.2107 1.21071 19.5858 1.58579L22.4142 4.41421C22.7893 4.78929 23 5.29799 23 5.82843V20C23 21.6569 21.6569 23 20 23H4C2.34315 23 1 21.6569 1 20V4C1 2.34315 2.34315 1 4 1H18.1716ZM4 3C3.44772 3 3 3.44772 3 4V20C3 20.5523 3.44772 21 4 21L5 21L5 15C5 13.3431 6.34315 12 8 12L16 12C17.6569 12 19 13.3431 19 15V21H20C20.5523 21 21 20.5523 21 20V6.82843C21 6.29799 20.7893 5.78929 20.4142 5.41421L18.5858 3.58579C18.2107 3.21071 17.702 3 17.1716 3H17V5C17 6.65685 15.6569 8 14 8H10C8.34315 8 7 6.65685 7 5V3H4ZM17 21V15C17 14.4477 16.5523 14 16 14L8 14C7.44772 14 7 14.4477 7 15L7 21L17 21ZM9 3H15V5C15 5.55228 14.5523 6 14 6H10C9.44772 6 9 5.55228 9 5V3Z" />
      </svg>
    `;
    // change button bg color to green
    editButton.classList.remove("bg-blue-500", "hover:bg-blue-700");
    editButton.classList.add("bg-green-500", "hover:bg-green-700");

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
    console.log("@editButtonListener --- will change list name to", inputValue);
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
    // change button bg color to blue
    editButton.classList.remove("bg-green-500", "hover:bg-green-700");
    editButton.classList.add("bg-blue-500", "hover:bg-blue-700");
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
