let form = document.querySelector("#reset-password-form");
const submitButton = document.querySelector(".submit");
const message = document.querySelector(".message");
let password = document.querySelector("#password");
let repeatPassword = document.querySelector("#repeat-password");
let timeoutId;

function checkValidity() {
  if (
    password.value.trim().length > 0 &&
    repeatPassword.value.trim().length > 0
  ) {
    submitButton.disabled = false;
  } else {
    submitButton.disabled = true;
  }
}

password.addEventListener("input", checkValidity);
repeatPassword.addEventListener("input", checkValidity);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    message.innerText = "";
  }, 3000);

  if (password.value !== repeatPassword.value) {
    message.innerText = "Passwords do not match!";
    password.value = "";
    repeatPassword.value = "";
    checkValidity();
    return;
  } else {
    clearTimeout(timeoutId);
    message.innerText = "Loading....";
  }

  if (form.dataset.submitting === "true") {
    // if form is already being submitted, do nothing
    return;
  }

  form.dataset.submitting = "true"; // set submitting flag

  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get("email");
  const token = urlParams.get("token");
  const data = { email, password: password.value, token };

  const dynamicURL = `${window.location.protocol}//${window.location.hostname}${
    window.location.port ? ":" + window.location.port : ""
  }/api/v1/auth/reset-password`;

  const response = await fetch(dynamicURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  form.dataset.submitting = "false"; // unset submitting flag

  const result = await response.json();
  message.innerText = Object.values(result);
  password.value = "";
  repeatPassword.value = "";
  checkValidity();
});
