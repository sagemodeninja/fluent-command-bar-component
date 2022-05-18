document.addEventListener("DOMContentLoaded", e => {
    const commandButtons = document.querySelectorAll(".command_button");
    const debug = document.querySelector("#debug");

    commandButtons.forEach(command => {
        command.addEventListener("click", e => {
            console.log(e);

            debug.style.display = "block";
            debug.textContent = `You clicked: ${e.target.label}`;
        });
    })
});