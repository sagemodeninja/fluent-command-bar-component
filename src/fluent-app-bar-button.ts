import { CustomComponent, customComponent } from '@sagemodeninja/custom-component';
import mousetrap from 'mousetrap';

@customComponent('fluent-app-bar-button')
export class FluentAppBarButton extends CustomComponent {
    static styles = `
        :host {
            display: inline-block;
            outline: none;
            user-select: none;
            -webkit-user-select: none;
            -webkit-tap-highlight-color: #000;
        }

        :host([is-secondary]) {
            display: block;
            margin: 4px;
        }

        :host([disabled]) {
            pointer-events: none;
        }

        /* Button */
        .button {
            align-items: center;
            border-radius: 5px;
            box-sizing: border-box;
            color: var(--fill-text-primary);
            cursor: default;
            display: flex;
            gap: 8px;
            min-height: 36px;
            padding: 10px;
            position: relative;
        }
        
        .button:active,
        .button.invoked {
            background-color: var(--fill-subtle-tertiary);
            color: var(--fill-text-secondary);
        }

        @media (hover: hover) {
            .button:hover {
                background-color: var(--fill-subtle-secondary);
            }
        }

        :host([disabled]) .button {
            color: var(--fill-text-disabled);
        }

        :host([disabled][is-secondary]) .button {
            min-width: 180px;
        }

        :host([appearance=bottom]:not([is-secondary])) .button {
            flex-direction: column;
            height: 100%;
            justify-content: center;
            width: 64px;
        }

        :host([appearance=collapsed]:not([is-secondary])) .button {
            justify-content: center;
            width: 64px;
        }

        .button:active .icon[use-accent]::part(icon),
        .button.invoked .icon[use-accent]::part(icon) {
            color: color-mix(in srgb, var(--fill-accent-default), transparent 10%);
        }

        :host([disabled]) .icon::part(icon) {
            color: var(--fill-text-disabled);
        }

        /* Custom icon */
        :host([disabled]) ::slotted(fluent-image-icon) {
            opacity: 0.49;
        }
        
        /* Content */
        .content {
            flex-grow: 1;
            font-family: 'Segoe UI Variable', sans-serif;
            font-size: 12px;
            font-variation-settings: "wght" 400, "opsz" 16;
            line-height: 1.5;
            text-align: center;
            white-space: nowrap;
        }

        .content:empty,
        :host([appearance=collapsed]:not([is-secondary])) .content {
            display: none;
        }

        :host([is-secondary]) .content {
            font-variation-settings: "wght" 400, "opsz" 20;
            font-size: 14px;
            text-align: left;
        }

        .content::before,
        .content::after {
            content: '';
            display: block;
            height: 0;
            width: 0;
        }

        .content::before{
            margin-top: -5px;
        }

        .content::after{
            margin-bottom: -4px;
        }

        /* Keyboard accelerator */
        .keyboard-accelerator {
            color: color-mix(in srgb, var(--fill-text-primary), transparent 40%);
            display: none;
            font-family: 'Segoe UI Variable Small', sans-serif;
            font-size: 12px;
            margin-left: 30px;
        }

        :host([is-secondary]) .keyboard-accelerator {
            display: inline-block;
        }

        :host([disabled]) .keyboard-accelerator {
            color: var(--fill-text-disabled) !important;
        }
    `;

    private _button: HTMLDivElement;
    private _iconSpan: HTMLElement;
    private _customIconSpan: HTMLSlotElement;
    private _contentSpan: HTMLSpanElement;
    private _acceleratorSpan: HTMLSpanElement;

    static get observedAttributes() {
        return ['icon', 'label', 'modifier', 'key', 'use-accent'];
    }

    /* Attributes */
    get icon() {
        return this.getAttribute('icon');
    }

    set icon(value) {
        this.setAttribute('icon', value);
        this.setIcon();
    }

    get label() {
        return this.getAttribute('label');
    }

    set label(value) {
        this.setAttribute('label', value);
        this.setLabel();
    }

    get command() {
        return this.getAttribute('command');
    }

    set command(value) {
        this.setAttribute('command', value);
    }

    get modifier() {
        return this.getAttribute('modifier');
    }

    set modifier(value) {
        this.setAttribute('modifier', value);
        this.setAccelerator();
    }

    get key() {
        return this.getAttribute('key');
    }

    set key(value) {
        this.setAttribute('key', value);
        this.setAccelerator();
    }

    get useAccent(): boolean {
        return this.hasAttribute('use-accent') && this.getAttribute('use-accent') !== 'false';
    }

    set useAccent(value: boolean) {
        this.toggleAttribute('use-accent', value);
        this.setIcon();
    }

    get title() {
        return this.getAttribute('title');
    }

    set title(value) {
        this.setAttribute('title', value);
        this.setTitle();
    }

    get disabled() {
        return this.hasAttribute('disabled');
    }

    /* DOM */
    get button() {
        this._button ??= this.shadowRoot.querySelector('.button');
        return this._button;
    }

    get iconSpan() {
        this._iconSpan ??= this.shadowRoot.querySelector('.icon');
        return this._iconSpan;
    }

    get customIconSlot() {
        this._customIconSpan ??= this.shadowRoot.querySelector('slot[name=icon]');
        return this._customIconSpan;
    }

    get contentSpan() {
        this._contentSpan ??= this.shadowRoot.querySelector('.content');
        return this._contentSpan;
    }

    get acceleratorSpan() {
        this._acceleratorSpan ??= this.shadowRoot.querySelector('.keyboard-accelerator');
        return this._acceleratorSpan;
    }

    /* Helpers */
    get formattedModifier() {
        return this.modifier.replace('Control', 'Ctrl');
    }

    get formattedAccelerator() {
        return this.modifier ? this.formattedModifier + '+' + this.key : this.key;
    }

    get supportedModifier() {
        return this.modifier.toLowerCase().replace('control', 'mod');
    }

    get supportedKey() {
        return this.key
            .toLowerCase()
            .replace('delete', 'del')
            .replace('+', '=')
            .replace('escape', 'esc');
    }

    render(): string {
        return `
            <div class='button'>
                <fluent-symbol-icon class='icon'></fluent-symbol-icon>
                <slot name='icon'></slot>
                <span class='content'></span>
                <span class='keyboard-accelerator'></span>
            </div>
        `;
    }

    connectedCallback() {
        this.setIcon();
        this.setLabel();

        this.setAttribute('tabindex', '0');

        // Event listeners
        this.customIconSlot.addEventListener('slotchange', e => {
            const nodes = this.customIconSlot.assignedNodes();
            const hasCustomIcons = nodes.length > 0;

            this.iconSpan.style.display = hasCustomIcons ? 'none' : 'inline-block';
            this.customIconSlot.style.display = hasCustomIcons ? 'default' : 'none';

            // Custom icon causes click events to stop at the icon.
            // This will bubble it further to the button itself.
            nodes.forEach(e => {
                e.addEventListener('click', e => {
                    this.click();
                    e.stopPropagation();
                });
            });
        });
    }

    attributeChangedCallback(name) {
        switch (name) {
            case 'label':
                this.setLabel();
                break;
            case 'icon':
            case 'use-accent':
                this.setIcon();
                break;
            case 'modifier':
            case 'key':
                this.setAccelerator();
                break;
        }
    }

    setIcon() {
        this.iconSpan.setAttribute('symbol', this.icon ?? '');
        this.iconSpan.toggleAttribute('use-accent', this.useAccent);
    }

    setLabel() {
        this.contentSpan.textContent = this.label;
        this.setTitle();
    }

    setAccelerator() {
        if (!this.key) return;

        this.acceleratorSpan.textContent = this.formattedAccelerator ?? '';
        this.setTitle();

        // Keyboard accelerator.
        var accelerator = this.modifier
            ? this.supportedModifier + '+' + this.supportedKey
            : this.supportedKey;

        mousetrap.bind(accelerator, () => {
            if (!this.disabled) {
                this.click();

                // Visual cue
                this.button.classList.add('invoked');
                setTimeout(() => this.button.classList.remove('invoked'), 150);
            }

            return false;
        });
    }

    setTitle() {
        const accelerator = this.formattedAccelerator ? `(${this.formattedAccelerator})` : '';
        let title = this.title ?? this.label ?? '';

        this.button.setAttribute('title', `${title} ${accelerator}`);
    }

    setAcceleratorWidth(value) {
        this.acceleratorSpan.style.width = value + 'px';
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'fluent-app-bar-button': FluentAppBarButton;
    }
}

// SEE: https://css-tricks.com/snippets/css/remove-gray-highlight-when-tapping-links-in-mobile-safari/
// document.addEventListener('touchstart', function () {}, true);
