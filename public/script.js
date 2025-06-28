const socket = io();

socket.on("roomList", (rooms) => {
  const list = document.getElementById("rooms");
  if (list) {
    list.innerHTML = ""; // clear previous

    rooms.forEach(room => {
      const li = document.createElement("li");
      li.classList.add("room-item");
      li.textContent = room;
      li.style.cursor = "pointer";

      li.onclick = () => {
        document.getElementById("room").value = room;
      };

      list.appendChild(li);
    });
  }
});

function joinRoom() {
  const username = document.getElementById("username").value;
  const room = document.getElementById("room").value;
  if (!username || !room) return alert("Both fields are required!");

  socket.emit("joinRoom", { username, room });
  socket.username = username;

  document.getElementById("login").style.display = "none";
  document.getElementById("chat").style.display = "block";
}

function sendMessage() {
  const input = document.getElementById("messageInput");
  if (input.value.trim()) {
    socket.emit("chatMessage", input.value);
    input.value = "";
  }
}

socket.on("message", (data) => {
  const msgBox = document.getElementById("messages");
  const msg = document.createElement("p");
  msg.classList.add("message");

  if (data.user === "system") {
    msg.classList.add("system");
    msg.innerHTML = `<em>${data.text}</em> <span class="timestamp">${data.time || ""}</span>`;
  } else if (data.user === socket.username) {
    msg.classList.add("right");
    msg.innerHTML = `${data.text} <span class="timestamp">${data.time || ""}</span>`;
  } else {
    msg.classList.add("left");
    msg.innerHTML = `<strong>${data.user}</strong><br>${data.text} <span class="timestamp">${data.time || ""}</span>`;
  }

  msgBox.appendChild(msg);
  msgBox.scrollTop = msgBox.scrollHeight;

});


const signupBtn = document.querySelector("#signup");
const loginBtn = document.querySelector("#login");
const formOpenBtn = document.querySelector("#form-open");
const formCloseBtn = document.querySelector(".form_close");
const home = document.querySelector(".home");
const pwShowHide = document.querySelectorAll(".pw_hide");
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");

formOpenBtn.addEventListener("click", (e) => {
  home.classList.add("active")
});

formCloseBtn.addEventListener("click", (e) => {
  home.classList.remove("active")
});

pwShowHide.forEach((icon) => {
  icon.addEventListener("click", () => {
    let getInput = icon.parentElement.querySelector("input");
    if (getInput.type === "password") {
      getInput.type = "text"
      icon.classList.replace("fa-eye-slash", "fa-eye");
    } else {
      getInput.type = "password"
      icon.classList.replace("fa-eye", "fa-eye-slash");
    };
  });
});

hamburger.addEventListener("click", (e) => {
  e.stopPropagation();
  navLinks.classList.toggle("toggled");
});

document.addEventListener("click", (e) => {
  if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
    navLinks.classList.remove("toggled");
  }
});