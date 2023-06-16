import { CustomComponent, customComponent } from '@sagemodeninja/custom-component';
import { FluentAppBarButton } from './fluent-app-bar-button';

const MORE_BTN_WIDTH = 47;
const COMMAND_BAR_PADDING = 12;

@customComponent('fluent-command-bar')
export class FluentCommandBar extends CustomComponent {
    static styles = `
        :host {
            display: inline-block;
            height: 46px;
            max-width: 100%;
            user-select: none;
        }

        .command-bar {
            align-items: center;
            border-radius: 4px;
            box-sizing: border-box;
            display: flex;
            padding: 6px;
            position: relative;
        }

        .primary-commands {
            align-items: center;
            column-gap: 5px;
            display: flex;
            overflow-x: hidden;
        }

        .primary-commands:not(:empty) {
            margin-right: 5px;
        }

        /* Button */
        .more-button {
            align-items: center;
            background-color: transparent;
            border-radius: 5px;
            box-sizing: border-box;
            color: var(--fill-text-primary);
            cursor: default;
            display: none;
            height: 100%;
            min-height: 36px;
            padding: 0 3px;
            position: relative;
            user-select: none;
            -webkit-user-select: none;
        }
        
        .more-button:hover {
            background-color: var(--fill-subtle-secondary);
        }
        
        .more-button:active {
            background-color: var(--fill-subtle-tertiary);
            color: var(--fill-text-secondary);
        }
        
        .more-button fluent-symbol-icon {
            margin: 0 8px;
        }

        /* Secondary commands */
        .secondary-commands {
            background-color: var(--background-fill-mica-base);
            background-blend-mode: color, luminosity;
            -webkit-backdrop-filter: saturate(180%) blur(100px);
            backdrop-filter: saturate(180%) blur(100px);
            border: solid 1px var(--stroke-card-default);
            border-radius: 5px;
            box-shadow: 0px 8px 16px var(--shadow-flyout);
            
            display: none;
            flex-direction: column;
            margin-top: 5px;
            position: absolute;
            right: 0;
            top: 100%;
            z-index: 1;
        }

        .command-bar.active .secondary-commands {
            display: flex;
        }

        .collapsed-commands:not(:empty) {
            border-top: solid 1px var(--stroke-divider-default);
        }

        .collapsed-commands fluent-app-bar-separator:first-child {
            display: none;
        }
    `;

    private _commandBar: HTMLDivElement;
    private _primaryCommandsContainer: HTMLDivElement;
    private _primaryCommandsSlot: HTMLSlotElement;
    private _moreButton: HTMLDivElement;
    private _secondaryCommandsSlot: HTMLSlotElement;
    private _collapsedCommandsContainer: HTMLDivElement;

    public isMovingCommand: boolean;
    public lastVisibleCommandIndex: number;
    public secondaryContainer: Element;
    public primaryCommands: FluentAppBarButton[];
    public primaryCommandsStore: any[];
    public parentResizeObserver: ResizeObserver;

    constructor() {
        super();

        this.setCommandAppearance = this.setCommandAppearance.bind(this);
        this.handleSlotChange = this.handleSlotChange.bind(this);
        this.autoAdjust = this.autoAdjust.bind(this);

        this.isMovingCommand = false;
        this.lastVisibleCommandIndex = 0;
    }

    static get observedAttributes() {
        return ['is-open', 'default-label-position', 'custom-menu'];
    }

    /* Attributes */
    get defaultLabelPosition() {
        return this.getAttribute('default-label-position') ?? 'right';
    }

    set defaultLabelPosition(value) {
        this.setAttribute('default-label-position', value);
        this.setLabelPosition();
    }

    get isOpen() {
        return this.hasAttribute('is-open') && eval(this.getAttribute('is-open'));
    }

    get customMenu(): boolean {
        return this.hasAttribute('custom-menu') && this.getAttribute('custom-menu') !== 'false';
    }

    set customMenu(value: boolean) {
        this.toggleAttribute('custom-menu', value);
    }

    /* DOM */
    get commandBar() {
        this._commandBar ??= this.shadowRoot.querySelector('.command-bar');
        return this._commandBar;
    }

    get primaryCommandsContainer() {
        this._primaryCommandsContainer ??= this.shadowRoot.querySelector('.primary-commands');
        return this._primaryCommandsContainer;
    }

    get primaryCommandsSlot() {
        this._primaryCommandsSlot ??= this.shadowRoot.querySelector('.primary-commands slot');
        return this._primaryCommandsSlot;
    }

    get moreButton() {
        this._moreButton ??= this.shadowRoot.querySelector('.more-button');
        return this._moreButton;
    }

    get secondaryCommandsSlot() {
        this._secondaryCommandsSlot ??= this.shadowRoot.querySelector(
            'slot[name=secondary-commands]'
        );
        return this._secondaryCommandsSlot;
    }

    get collapsedCommandsContainer() {
        this._collapsedCommandsContainer ??= this.shadowRoot.querySelector('.collapsed-commands');
        return this._collapsedCommandsContainer;
    }

    render(): string {
        return `
            <div class='command-bar'>
                <div class='primary-commands'>
                    <slot></slot>
                </div>
                <div class='more-button' title='See more'>
                    <fluent-symbol-icon symbol='More' font-size='20'></fluent-symbol-icon>
                </div>
                <div class='secondary-commands'>
                    <slot name='secondary-commands'></slot>
                    <div class='collapsed-commands'></div>
                <div>
            </div>
        `;
    }

    connectedCallback() {
        // Event listeners
        this.moreButton.addEventListener('click', e => {
            if (this.customMenu)
                this.dispatchEvent(new CustomEvent('menuinvoked', { bubbles: true }));
            else this.toggleAttribute('is-open', !this.isOpen);

            e.stopPropagation();
        });

        this.primaryCommandsSlot.addEventListener('slotchange', this.handleSlotChange);

        this.secondaryCommandsSlot.addEventListener('slotchange', e => {
            this.secondaryContainer = this.secondaryCommandsSlot.assignedNodes()[0] as Element;

            this.setMoreButtonVisibility();

            if (!this.secondaryContainer) return;

            var commands = this.secondaryContainer.querySelectorAll(
                'fluent-app-bar-button'
            ) as NodeListOf<FluentAppBarButton>;
            var separators = this.secondaryContainer.querySelectorAll('fluent-app-bar-separator');

            // Calculate width of accelerator labels based on longest length.
            const longest = Array.from(commands).reduce((a, b) =>
                a.formattedAccelerator.length > b.formattedAccelerator.length ? a : b
            );
            const acceleratorWidth = longest.formattedAccelerator.length * 6;

            commands.forEach(command => {
                command.toggleAttribute('is-secondary', true);
                command.setAcceleratorWidth(acceleratorWidth);
            });

            separators.forEach(separator => {
                separator.toggleAttribute('horizontal', true);
            });
        });

        this.parentResizeObserver = new ResizeObserver(() => this.autoAdjust());
        this.parentResizeObserver.observe(this.parentElement);

        window.addEventListener('click', () => {
            this.toggleAttribute('is-open', false);
        });
    }

    attributeChangedCallback(name) {
        switch (name) {
            case 'is-open':
                this.setIsOpen();
                break;
            case 'default-label-position':
                this.setLabelPosition();
                break;
        }
    }

    disconnectedCallback() {
        this.parentResizeObserver.disconnect();
    }

    setLabelPosition() {
        if (!['bottom', 'collapsed', 'right'].includes(this.defaultLabelPosition)) return;

        var appearance = this.defaultLabelPosition;

        if (appearance === 'bottom' && !this.isOpen) {
            appearance = 'collapsed';
        }

        if (this.setCommandAppearance(appearance)) return;

        // Waits for primary commands to be stored, then set appearance.
        const waitInterval = setInterval(() => {
            clearInterval(waitInterval);
            this.setCommandAppearance(appearance);
        }, 50);
    }

    setCommandAppearance(appearance) {
        if (this.primaryCommands) {
            this.primaryCommands.forEach(command => {
                command.setAttribute('appearance', appearance);
            });

            return true;
        }

        return false;
    }

    setMoreButtonVisibility() {
        const hasCommands =
            (this.secondaryContainer && this.secondaryContainer.children.length) ||
            this.collapsedCommandsContainer.children.length;
        this.moreButton.style.display = hasCommands ? 'flex' : 'none';
    }

    setIsOpen() {
        this.commandBar.classList.toggle('active', this.isOpen);
        this.setLabelPosition();
    }

    handleSlotChange() {
        const nodes = this.primaryCommandsSlot.assignedNodes();
        this.primaryCommands = nodes.filter(
            command =>
                command instanceof HTMLElement && command.nodeName === 'FLUENT-APP-BAR-BUTTON'
        ) as FluentAppBarButton[];

        if (!this.isMovingCommand) {
            this.style.opacity = '0';

            this.primaryCommandsStore = this.primaryCommands.map(command => ({
                parent: command.parentElement,
                self: command,
                previous: command.previousElementSibling,
                bounds: command.getClientRects()[0].right - this.getClientRects()[0].left,
            }));
            this.lastVisibleCommandIndex = this.primaryCommands.length - 1;

            // Waits for primary commands to be stored, then do initial auto adjusting.
            const initialAdjustInterval = setInterval(() => {
                if (this.primaryCommandsStore) {
                    clearInterval(initialAdjustInterval);
                    this.primaryCommandsStore.forEach(this.autoAdjust);
                    this.setMoreButtonVisibility();
                    this.style.opacity = '1';
                }
            }, 10);
        }

        this.isMovingCommand = false;
        this.setLabelPosition();
    }

    autoAdjust() {
        const store = this.primaryCommandsStore ?? [];

        if (store.length === 0) return;

        const parentWidth = this.parentElement.getClientRects()[0].width;
        const potentialWidth =
            parentWidth - (this.getLeft() + MORE_BTN_WIDTH + COMMAND_BAR_PADDING);

        const index = this.lastVisibleCommandIndex;
        const rightIndex = Math.min(store.length - 1, index + 1);

        const command = store[index];
        const rightCommand = store[rightIndex];

        if (index >= 0 && command.bounds > potentialWidth) {
            this.moveCommands(command.self, this, this.collapsedCommandsContainer);
            this.lastVisibleCommandIndex -= 1;

            if (index > 0 && command.previous.nodeName === 'FLUENT-APP-BAR-SEPARATOR')
                this.moveCommands(command.previous, this, this.collapsedCommandsContainer);
        }

        if (rightIndex !== index && rightCommand.bounds < potentialWidth) {
            if (rightIndex > 0 && rightCommand.previous.nodeName === 'FLUENT-APP-BAR-SEPARATOR')
                this.moveCommands(rightCommand.previous, this.collapsedCommandsContainer, this);

            this.moveCommands(rightCommand.self, this.collapsedCommandsContainer, this);
            this.lastVisibleCommandIndex = rightIndex;
        }
    }

    getLeft() {
        if (!this.previousElementSibling) return 0;

        const parentLeft = this.parentElement.getClientRects()[0].left;
        const siblingRight = this.previousElementSibling.getClientRects()[0].right;

        return siblingRight - parentLeft;
    }

    moveCommands(command, origin, destination) {
        const collapse = origin === this;

        this.isMovingCommand = true;

        origin.removeChild(command);

        if (collapse) {
            const firstSibling = destination.firstChild;
            destination.insertBefore(command, firstSibling);
        } else {
            destination.appendChild(command);
        }

        // commandmoved event.
        var eventOptions = {
            bubbles: true,
            detail: {
                type: command.nodeName,
                command: command.dataset.command ?? null,
                collapsed: collapse,
            },
        };
        var customEvent = new CustomEvent('commandmoved', eventOptions);
        this.dispatchEvent(customEvent);

        this.toggleAttributes(command, collapse);
        this.setMoreButtonVisibility();
    }

    toggleAttributes(command, toggle) {
        let attribute;

        switch (command.nodeName) {
            case 'FLUENT-APP-BAR-BUTTON':
                attribute = 'is-secondary';
                break;
            case 'FLUENT-APP-BAR-SEPARATOR':
                attribute = 'horizontal';
                break;
        }

        command.toggleAttribute(attribute, toggle);
    }
}
