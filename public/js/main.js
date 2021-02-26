function login(event) {
    event.preventDefault();
    window.location.assign("/");

    console.log(users);
}

$(document).ready(function() {
    initializePage();
})

function initializePage() {
    document.getElementById("loginform").addEventListener("submit", login);
}