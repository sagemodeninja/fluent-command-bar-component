import '/public/css/style.css';
import '/public/fonts/segoe-fluent-icons/segoe-fluent-icons.css';
import '/public/fonts/segoe-ui-variable/segoe-ui-variable.css';

document.addEventListener('DOMContentLoaded', e => {
    const commandButtons = document.querySelectorAll('.command_button');
    const shareCommand = document.querySelector('#share_command');
    const enabelDisableButton = document.querySelector('#enable_disable');
    const debug = document.querySelector('#debug');

    commandButtons.forEach(command => {
        command.addEventListener('click', e => {
            debug.style.display = 'block';
            debug.textContent = `You clicked: ${e.target.label}`;
        });
    });

    enabelDisableButton.addEventListener('click', e => {
        shareCommand.toggleAttribute('disabled');
        enabelDisableButton.textContent = shareCommand.disabled ? 'Enabled Share' : 'Disable Share';

        // Reset debug.
        debug.style.display = 'none';
    });
});
