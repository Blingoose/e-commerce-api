const form = document.querySelector("#reset-password-form");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = document.querySelector(".message");
  const email = document.querySelector("#email").value;
  const token = document.querySelector("#token").value;
  const password = document.querySelector("#password").value;
  const repeatPassword = document.querySelector("#repeat-password").value;
  if (password !== repeatPassword) {
    return (message.innerText = "Passwords do not match!");
  }
  const data = { email, password, token };
  const url = `${window.location.protocol}//${window.location.hostname}/api/v1/auth/reset-password`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  message.innerText = Object.values(result);
});
