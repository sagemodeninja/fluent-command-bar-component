import { CustomComponent, customComponent, property, query } from '@sagemodeninja/custom-component';
import { FluentAppBarButton } from './fluent-app-bar-button';
import { autoUpdate, computePosition, offset, flip, shift } from '@floating-ui/dom';

const MORE_BTN_WIDTH = 42
const SPACING = 6

export const defer = (func: any, delay?: number) => {
    window.setTimeout(func, delay ?? 0)
}

export type CommandState = { [command: string]: boolean }

@customComponent('fluent-command-bar')
export class FluentCommandBar extends CustomComponent {
    static styles = `
        :host {
            box-sizing: border-box;
            display: block;
            height: 46px;
            padding: 6px;
            user-select: none;
            width: 100%;
        }

        .control {
            align-items: center;
            display: flex;
            gap: 6px;
            width: 100%;
        }

        :host([position=right]) .control {
            justify-content: flex-end;
        }

        .primary-container {
            align-items: center;
            display: flex;
            gap: 6px;
        }

        /* Button */
        .menu-button {
            align-items: center;
            background-color: transparent;
            border-radius: 5px;
            box-sizing: border-box;
            color: var(--fill-text-primary);
            cursor: default;
            display: none;
            height: 100%;
            min-height: 36px;
            outline: none;
            padding: 0 3px;
            user-select: none;
            -webkit-user-select: none;
        }
        
        .menu-button:focus {
            background-color: var(--fill-subtle-secondary);
            box-shadow: 0 0 0 1.5px var(--fill-accent-secondary);
        }

        .menu-button:hover {
            background-color: var(--fill-subtle-secondary);
        }
        
        .menu-button.invoked,
        .menu-button:active {
            background-color: var(--fill-subtle-tertiary);
            color: var(--fill-text-secondary);
        }
        
        .menu-button fluent-symbol-icon {
            margin: 0 8px;
        }

        /* Secondary commands */
        .menu {
            background-color: var(--background-fill-mica-base);
            border: solid 1px var(--stroke-card-default);
            border-radius: 8px;
            box-shadow: 0px 8px 16px var(--shadow-flyout);
            inset: unset;
            outline: none;
            padding: 0;
            position: fixed;
        }

        .collapsed-container:not(:empty) {
            border-top: solid 1px var(--stroke-divider-default);
        }

        .collapsed-container fluent-app-bar-separator:first-child {
            display: none;
        }
    `

    private readonly _commands: FluentAppBarButton[]
    private readonly _primaryCommands: FluentAppBarButton[]
    private readonly _commandWidths: number[]
    private readonly _resizeObserver: ResizeObserver
    private readonly _commandResizeObserver: ResizeObserver
    
    private _lastWrappedIndex: number
    private _menuShown: boolean
    private _dismissMenu: any
    private _menuCleanup: any

    @query('.control')
    private _control: HTMLDivElement

    @query('slot')
    private _container: HTMLSlotElement

    @query('.menu-button')
    private _menuButton: HTMLDivElement

    @query('.menu')
    private _menu: HTMLDivElement

    @query('.secondary-container')
    private _secondaryContainer: HTMLDivElement

    @query('.collapsed-container')
    private _collapsedContainer: HTMLDivElement

    @property()
    public position: string

    @property({ attribute: 'default-label-position' })
    public defaultLabelPosition: string

    @property({ attribute: 'custom-menu' })
    public customMenu: boolean

    public get commands() {
        return this._commands
    }

    /* Legacy */
    public get isOpen() {
        return this._menuShown
    }

    constructor() {
        super()

        this._commands = []
        this._primaryCommands = []
        this._commandWidths = []
        this._resizeObserver = new ResizeObserver(this.wrap.bind(this))
        this._commandResizeObserver = new ResizeObserver(this.updateWidths.bind(this))
    }

    public render() {
        return `
            <div class="control">
                <slot class="primary-container" part="primary-container"></slot>
                <div class="menu-button" title="See more" tabindex="0">
                    <fluent-symbol-icon symbol="More" font-size="20"></fluent-symbol-icon>
                </div>
                <div class="menu" popover>
                    <div class="secondary-container"></div>
                    <div class="collapsed-container"></div>
                <div>
            </div>
        `
    }

    public connectedCallback() {
        this.addEventListeners()
    }

    public toggleDisabled(state: CommandState) {
        const commands = Object.keys(state)
        this._commands.forEach(c => {
            const command = c.command ?? c.label

            if (commands.includes(command))
                c.disabled = state[command]
        })
    }

    public toggleHidden(state: CommandState) {
        const commands = Object.keys(state)
        this._commands.forEach(c => {
            const command = c.command ?? c.label

            if (commands.includes(command))
                c.hidden = state[command]
        })
    }

    protected stateHasChanged(changes: Map<string, any>): void {
        if (changes.has('defaultLabelPosition'))
            this.setLabelPosition()
    }

    private addEventListeners() {
        this._container.addEventListener('slotchange', this.updateCommands.bind(this))
        this._resizeObserver.observe(this._control)
        this._menuButton.addEventListener('click', () => this.onMenuInvoke(false))
        this._menuButton.addEventListener('keypress', this.onMenuAltInvoke.bind(this))
        this._menu.addEventListener('toggle', this.onMenuToggle.bind(this))
        this._dismissMenu = (e: FocusEvent) => {
            if (!this._menu.contains(e.relatedTarget as Node)) {
                this._menu.removeEventListener('focusout', this._dismissMenu)
                this.hideMenu()
            }
        }
    }

    private updateCommands() {
        const commands = this.querySelectorAll('fluent-app-bar-button')

        commands.forEach(command => {
            if (this._commands.includes(command))
                return

            this._commands.push(command)
            command.addEventListener('invoke', this.onCommandInvoked.bind(this))

            if (command.isSecondary) {
                command.collapsed = true
                this._secondaryContainer.append(command)
                return
            } 

            command.dataset.index = this._primaryCommands.length.toString()
            
            this._primaryCommands.push(command)
            this._commandWidths.push(command.offsetWidth + SPACING)
            this._commandResizeObserver.observe(command)
        })

        this.wrap()
    }

    private onMenuInvoke(keyboard: boolean) {
        if (!keyboard) this._menuButton.blur()

        this.customMenu
            ? this.dispatchEvent(new CustomEvent('menuinvoked', { bubbles: true }))
            : this.showMenu()
    }

    private onMenuAltInvoke(e: KeyboardEvent) {
        if (e.code !== 'Enter') return

        // Visual cue
        this._menuButton.classList.add('invoked')
        defer(() => this._menuButton.classList.remove('invoked'), 150)

        this.onMenuInvoke(true)
    }

    private onCommandInvoked(e: CustomEvent) {
        const target = e.target as FluentAppBarButton

        this.hideMenu()
        this.dispatchEvent(new CustomEvent('command', {
            detail: target.command ?? target.label
        }))
    }

    private wrap() {
        const width = this._control.offsetWidth - MORE_BTN_WIDTH - SPACING
        const count = this._primaryCommands.length

        let index = count
        let totalWidth = 0

        for (var i = 0; i < count; i++) {
            totalWidth += this._commandWidths[i]

            if (totalWidth > width) {
                index = i
                break
            }
        }

        if (index === this._lastWrappedIndex)
            return

        this._lastWrappedIndex = index

        this._primaryCommands.forEach((c,i) => {
            this.moveCommand(c, i >= index)
        })

        this.toggleMenuBtn()
    }

    private moveCommand(command: FluentAppBarButton, collapse: boolean) {
        if (collapse || command.collapsed) {
            const target = collapse ? this._collapsedContainer : this
            target.append(command)
        }

        command.collapsed = collapse

        // Notifies custom menu about move
        const event = new CustomEvent('commandmoved', {
            bubbles: true,
            detail: {
                type: command.nodeName,
                command: command.dataset.command ?? null,
                collapsed: collapse,
            },
        })

        this.dispatchEvent(event)
    }

    private toggleMenuBtn() {
        const wrapped = (this._secondaryContainer && this._secondaryContainer.children.length) || this._collapsedContainer.children.length
        this._menuButton.style.display = wrapped ? 'flex' : 'none'
    }

    private updateWidths(entries: ResizeObserverEntry[]) {
        entries.forEach(entry => {
            const command = entry.target as FluentAppBarButton

            if (command.collapsed) return
            
            const index = parseInt(command.dataset.index)
            this._commandWidths[index] = command.offsetWidth + SPACING
        })

        defer(this.wrap.bind(this))
    }

    private showMenu() {
        if (this._menuShown) return

        this._menuShown = true
        this._menu.showPopover()

        this._menuCleanup = autoUpdate(this._menuButton, this._menu, async () => {
            const {x, y} = await computePosition(this._menuButton, this._menu, {
                placement: 'bottom-end',
                middleware: [offset(8), flip(), shift()]
            })

            Object.assign(this._menu.style, {
                left: `${x}px`,
                top: `${y}px`
            })
        })

        this._menu.addEventListener('focusout', this._dismissMenu)
    }

    private hideMenu() {
        this._menu.hidePopover()
    }

    private onMenuToggle(e: ToggleEvent) {
        if (e.newState === 'closed') {
            this._dismissMenu(e)
            this._menuCleanup()
            defer(() => this._menuShown = false, 150)
        }
    }

    // TODO: Reimplement
    private setLabelPosition() {
        if (!['bottom', 'collapsed', 'right'].includes(this.defaultLabelPosition)) return

        var appearance = this.defaultLabelPosition

        if (appearance === 'bottom' /*&& !this.isOpen*/) {
            appearance = 'collapsed'
        }

        if (this._primaryCommands) {
            this.setCommandAppearance(appearance)
            return
        }

        // Waits for primary commands to be stored, then set appearance.
        defer(() => this.setCommandAppearance(appearance), 50)
    }

    // TODO: Reimplement
    private setCommandAppearance(appearance) {
        this._primaryCommands?.forEach(command => {
            command.setAttribute('appearance', appearance)
        })

        return !!this._primaryCommands
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'fluent-command-bar': FluentCommandBar
    }
}
