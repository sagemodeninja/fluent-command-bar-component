import '/public/css/style.css';
import '/public/fonts/segoe-fluent-icons/segoe-fluent-icons.css';
import '/public/fonts/segoe-ui-variable/segoe-ui-variable.css';

import './';
import '@sagemodeninja/fluent-icon-element-component';
import { FluentAppBarButton, FluentCommandBar } from './';
import colorSchemeProvider from '@sagemodeninja/color-scheme-provider';
import { DesignToken } from '@sagemodeninja/design-token-provider';

document.addEventListener('DOMContentLoaded', () => {
    const testCommand = document.getElementById('test-command') as FluentCommandBar
    const secondCommand = document.getElementById('second-command') as FluentCommandBar
    const modeCommand = document.querySelector('#mode_command') as FluentAppBarButton
    const toggleDisableBtn = document.querySelector('#toggle_disable')
    const toggleHideBtn = document.querySelector('#toggle_hide')
    const debug = document.querySelector('#debug') as HTMLParagraphElement

    let disabled: boolean
    let hidden: boolean

    toggleDisableBtn.addEventListener('click', () => {
        disabled = !disabled
        
        const state = {
            'Share': disabled,
            'Edit': disabled,
            'sample': disabled
        }

        testCommand.toggleDisabled(state)
        secondCommand.toggleDisabled(state)
        debug.style.display = 'none'
    })

    toggleHideBtn.addEventListener('click', () => {
        hidden = !hidden
        testCommand.toggleHidden({ 'Edit': hidden })
        debug.style.display = 'none'
    })

    modeCommand.addEventListener('invoke', () => colorSchemeProvider.toggle());
    colorSchemeProvider.subscribeNotification(() => applyDesignTokens());

    testCommand.addEventListener('command', (e: CustomEvent) => {
        debug.style.display = 'block';
        debug.textContent = `You clicked: ${e.detail}`;
    })

    applyDesignTokens();
});

function applyDesignTokens() {
    // Design tokens
    const fillTextPrimary = new DesignToken<string>('fill-text-primary');
    const fillTextSecondary = new DesignToken<string>('fill-text-secondary');
    const fillTextDisabled = new DesignToken<string>('fill-text-disabled');
    const fillAccentDefault = new DesignToken<string>('fill-accent-default');
    const fillAccentSecondary = new DesignToken<string>('fill-accent-secondary');
    const fillSubtleSecondary = new DesignToken<string>('fill-subtle-secondary');
    const fillSubtleTertiary = new DesignToken<string>('fill-subtle-tertiary');
    const backgroundFillMicaBase = new DesignToken<string>('background-fill-mica-base');
    const strokeCardDefault = new DesignToken<string>('stroke-card-default');
    const strokeDividerDefault = new DesignToken<string>('stroke-divider-default');
    const shadowFlyout = new DesignToken<string>('shadow-flyout');

    const isLight = colorSchemeProvider.colorScheme === 'light';

    document.body.classList.toggle('dark', !isLight);
    fillTextPrimary.setDefault(isLight ? 'rgb(0 0 0 / 89.56%)' : '#ffffff');
    fillTextSecondary.setDefault(isLight ? 'rgb(0 0 0 / 60.63%)' : 'rgb(255 255 255 / 78.6%)');
    fillTextDisabled.setDefault(isLight ? 'rgb(0 0 0 / 36.14%)' : 'rgb(255 255 255 / 36.28%)');
    fillAccentDefault.setDefault(isLight ? '#005FB8' : '#60CDFF');
    fillAccentSecondary.setDefault(isLight ? '#005FB8E6' : '#60CDFFE6');
    fillSubtleSecondary.setDefault(isLight ? 'rgb(0 0 0 / 3.73%)' : 'rgb(255 255 255 / 6.05%)');
    fillSubtleTertiary.setDefault(isLight ? 'rgb(0 0 0 / 2.41%)' : 'rgb(255 255 255 / 4.19%)');
    backgroundFillMicaBase.setDefault(isLight ? '#f3f3f3' : '#202020');
    strokeCardDefault.setDefault(isLight ? '#e5e5e5' : 'rgb(255 255 255 / 8.37%)');
    strokeDividerDefault.setDefault(isLight ? 'rgb(0 0 0 / 8.03%)' : 'rgb(255 255 255 / 8.37%)');
    shadowFlyout.setDefault(isLight ? 'rgb(0 0 0 / 14%)' : 'rgb(0 0 0 / 26%)');
}
