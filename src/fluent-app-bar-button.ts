import { CustomComponent, customComponent, property, query } from '@sagemodeninja/custom-component'
import * as mousetrap from 'mousetrap'
import { defer } from './fluent-command-bar'

@customComponent('fluent-app-bar-button')
export class FluentAppBarButton extends CustomComponent {
    static styles = `
        :host {
            color: var(--fill-text-primary);
            cursor: default;
            display: inline-block;
            outline: none;
            user-select: none;
            -webkit-user-select: none;
            -webkit-tap-highlight-color: #000;
        }

        :host([collapsed]) {
            display: block;
            margin: 4px;
        }

        :host([hidden]) {
            display: none;
        }

        :host([disabled]) {
            pointer-events: none;
        }

        .control {
            align-items: center;
            border-radius: 5px;
            box-sizing: border-box;
            display: flex;
            gap: 8px;
            min-height: 36px;
            padding: 10px;
            position: relative;
        }
        
        :host(:focus) .control {
            background-color: var(--fill-subtle-secondary);
            box-shadow: 0 0 0 1.5px var(--fill-accent-secondary);
        }

        @media (hover: hover) {
            :host(:hover) .control {
                background-color: var(--fill-subtle-secondary);
            }
        }

        :host(:active) .control,
        :host(.invoked) .control {
            background-color: var(--fill-subtle-tertiary);
            color: var(--fill-text-secondary);
        }

        :host(:active) .icon[use-accent]::part(icon),
        :host(.invoked) .icon[use-accent]::part(icon) {
            color: color-mix(in srgb, var(--fill-accent-default), transparent 30%);
        }

        :host([disabled]) .control {
            color: var(--fill-text-disabled);
        }

        :host([use-accent]) .icon::part(icon) {
            color: var(--fill-accent-default);
        }

        :host([disabled]) .icon::part(icon) {
            color: var(--fill-text-disabled);
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

        :host([collapsed]) .content {
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

        :host([collapsed]) .keyboard-accelerator {
            display: inline-block;
        }

        :host([disabled]) .keyboard-accelerator {
            color: var(--fill-text-disabled) !important;
        }
    `

    @query('.icon')
    private _iconSpan: HTMLElement

    @query('.content')
    private _contentSpan: HTMLSpanElement

    @query('.keyboard-accelerator')
    private _acceleratorSpan: HTMLSpanElement

    @property()
    public icon: string

    @property()
    public label: string

    @property()
    public command: string

    @property()
    public modifier: string

    @property()
    public key: string

    @property({ attribute: 'is-secondary' })
    public isSecondary: boolean

    @property({ attribute: 'use-accent' })
    public useAccent: boolean

    @property()
    public disabled: boolean

    @property()
    public collapsed: boolean

    get formattedModifier() {
        return this.modifier.replace('Control', 'Ctrl');
    }

    get formattedAccelerator() {
        return this.modifier ? this.formattedModifier + ' + ' + this.key : this.key;
    }

    get supportedModifier() {
        return this.modifier.toLowerCase().replace('control', 'mod');
    }

    get supportedKey() {
        return this.key
            .toLowerCase()
            .replace('delete', 'del')
            .replace('+', '=')
            .replace('escape', 'esc')
    }

    public render() {
        return `
            <div class="control" part="control">
                <slot name="icon">
                    <fluent-symbol-icon class="icon"></fluent-symbol-icon>
                </slot>
                <span class='content'></span>
                <span class='keyboard-accelerator'></span>
            </div>
        `
    }

    connectedCallback() {
        this.setState()
        this.addEventListeners()
    }

    protected stateHasChanged() {
        this.setState()
    }
    
    private setState() {
        this._contentSpan.textContent = this.label
        this._iconSpan.setAttribute('symbol', this.icon ?? '')
        this.tabIndex = !this.disabled ? 0 : -1
        this.setAccelerator()
        this.setTitle()
    }

    private addEventListeners() {
        this.addEventListener('click', () => this.onInvoke(false))
        this.addEventListener('keypress', ({code}) => {
            if (code === 'Enter') this.onAltInvoke()
        })
    }

    private setAccelerator() {
        if (!this.key) return

        this._acceleratorSpan.textContent = this.formattedAccelerator ?? ''

        // Keyboard accelerator
        var accelerator = this.modifier
            ? this.supportedModifier + '+' + this.supportedKey
            : this.supportedKey

        mousetrap.bind(accelerator, () => {
            if (!this.disabled) {
                this.onAltInvoke()
            }

            return false
        })
    }

    private setTitle() {
        const accelerator = this.formattedAccelerator && `(${this.formattedAccelerator})`
        this.title = [this.label, accelerator].filter(Boolean).join(' ')
    }

    private onInvoke(keyboard: boolean) {
        if (!keyboard) this.blur()
        this.dispatchEvent(new CustomEvent('invoke'))
    }

    private onAltInvoke() {
        if (this.disabled || this.hidden)
            return

        // Visual cue
        this.classList.add('invoked')
        defer(() => this.classList.remove('invoked'), 200)

        this.onInvoke(true)
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'fluent-app-bar-button': FluentAppBarButton;
    }
}