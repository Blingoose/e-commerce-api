const form = document.querySelector("#reset-password-form");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  let timeoutId;
  const message = document.querySelector(".message");
  const email = document.querySelector("#email").value;
  const token = document.querySelector("#token").value;
  const password = document.querySelector("#password").value;
  const repeatPassword = document.querySelector("#repeat-password").value;

  if (password !== repeatPassword) {
    message.innerText = "Passwords do not match!";
    return;
  }

  if (form.dataset.submitting === "true") {
    // if form is already being submitted, do nothing
    return;
  }

  form.dataset.submitting = "true"; // set submitting flag

  const data = { email, password, token };

  const dynamicURL = `${window.location.protocol}//${window.location.hostname}${
    window.location.port ? ":" + window.location.port : ""
  }/api/v1/auth/reset-password`;

  console.log(dynamicURL);

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
  password.innerText = "";
  repeatPassword.innerText = "";

  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    message.innerText = "";
  }, 3000);
});
