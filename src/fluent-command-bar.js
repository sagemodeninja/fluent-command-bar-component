const MORE_BTN_WIDTH = 47;
const COMMAND_BAR_PADDING = 12;

(function() {
    const template = document.createElement("template");
    template.innerHTML = `
    <style>
    :host {
        display: inline-block;
        outline: none;
        user-select: none;
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
        background-color: transparent;
        border-radius: 5px;
        box-sizing: border-box;
        color: #1b1b1b;
        cursor: default;
        display: flex;
        height: 36px;
        min-height: 36px;
        overflow: hidden;
        padding: 10px;
        position: relative;
    }
    
    .button:active {
        background-color: rgba(160, 160, 160, 0.06);
        color: rgba(27, 27, 27, 0.49) !important;
    }

    @media (hover: hover) {
        :host(:focus) .button,
        .button:hover {
            background-color: rgba(156, 156, 156, 0.1);
        }
    }

    :host([disabled]) .button {
        color: rgba(27, 27, 27, 0.49) !important;
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

    /* Custom icon */
    :host([disabled]) ::slotted(fluent-image-icon) {
        opacity: 0.49;
    }
    
    /* Content */
    .content {
        flex-grow: 1;
        font-family: 'Segoe UI Variable Small', sans-serif;
        font-size: 12px;
        font-weight: 400;
        line-height: 36px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .content:not(:empty) {
        margin-left: 8px;
    }

    :host([appearance=bottom]:not([is-secondary])) .content {
        line-height: 1.5;
        margin-left: 0;
        text-align: center;
        white-space: normal;
    }

    :host([appearance=collapsed]:not([is-secondary])) .content {
        display: none;
    }

    :host([is-secondary]) .content {
        font-family: 'Segoe UI Variable Text', sans-serif;
        font-size: 14px;
    }

    /* Keyboard accelerator */
    .keyboard-accelerator {
        color: #5b5b5b;
        display: none;
        font-family: 'Segoe UI Variable Small', sans-serif;
        font-size: 12px;
        margin-left: 30px;
    }

    :host([is-secondary]) .keyboard-accelerator {
        display: inline-block;
    }

    :host([disabled]) .keyboard-accelerator {
        color: rgba(27, 27, 27, 0.49) !important;
    }
    </style>
    <div class='button'>
        <fluent-symbol-icon class='icon'></fluent-symbol-icon>
        <slot name='icon'></slot>
        <span class='content'></span>
        <span class='keyboard-accelerator'></span>
    </div>
    `;

    class FluentAppBarButton extends HTMLElement {
        constructor() {
            super();

            this.attachShadow({ mode: "open" });
            this.shadowRoot.append(template.content.cloneNode(true));
        }

        static get observedAttributes() {
            return ["icon", "label", "modifier", "key"];
        }

        /* Attributes */
        get icon() {
            return this.getAttribute("icon");
        }

        set icon(value) {
            this.setAttribute("icon", value);
            this.setIcon();
        }

        get label() {
            return this.getAttribute("label");
        }

        set label(value) {
            this.setAttribute("label", value);
            this.setLabel();
        }

        get modifier() {
            return this.getAttribute("modifier");
        }

        set modifier(value) {
            this.setAttribute("modifier", value);
            this.setAccelerator();
        }

        get key() {
            return this.getAttribute("key");
        }

        set key(value) {
            this.setAttribute("key", value);
            this.setAccelerator();
        }

        get title() {
            return this.getAttribute("title");
        }

        set title(value) {
            this.setAttribute("title", value);
            this.setTitle();
        }

        get disabled() {
            return this.hasAttribute("disabled");
        }

        /* DOM */
        get button() {
            this._button ??= this.shadowRoot.querySelector(".button");
            return this._button;
        }
        
        get iconSpan() {
            this._iconSpan ??= this.shadowRoot.querySelector(".icon");
            return this._iconSpan;
        }

        get customIconSlot() {
            this._customIconSpan ??= this.shadowRoot.querySelector("slot[name=icon]");
            return this._customIconSpan;
        }

        get contentSpan() {
            this._contentSpan ??= this.shadowRoot.querySelector(".content");
            return this._contentSpan;
        }

        get acceleratorSpan() {
            this._acceleratorSpan ??= this.shadowRoot.querySelector(".keyboard-accelerator");
            return this._acceleratorSpan;
        }

        /* Helpers */
        get formattedModifier() {
            return this.modifier.replace("Control", "Ctrl");
        }

        get formattedAccelerator() {
            return this.modifier
                ? this.formattedModifier + "+" + this.key
                : this.key;
        }

        get supportedModifier() {
            return this.modifier.toLowerCase().replace("control", "mod");
        }

        get supportedKey() {
            return this.key.toLowerCase().replace("delete", "del").replace("+", "=").replace("escape", "esc");
        }

        connectedCallback() {
            this.setIcon();
            this.setLabel();

            this.setAttribute("tabindex", "0");

            // Event listeners
            this.customIconSlot.addEventListener("slotchange", e => {
                const nodes = this.customIconSlot.assignedNodes();
                const hasCustomIcons = nodes.length > 0;

                this.iconSpan.style.display = hasCustomIcons ? "none" : "inline-block";
                this.customIconSlot.style.display = hasCustomIcons ? "default" : "none";

                // Custom icon causes click events to stop at the icon.
                // This will bubble it further to the button itself.
                nodes.forEach(e => {
                    e.addEventListener("click", e=> {
                        this.click();
                        e.stopPropagation();
                    });
                });
            });
        }

        attributeChangedCallback(name, oldValue, newValue) {
            switch (name) {
                case "icon": this.setIcon(); break;
                case "label": this.setLabel(); break;
                case "modifier":
                case "key":
                    this.setAccelerator();
                    break;
            }
        }

        setIcon() {
            this.iconSpan.setAttribute("symbol", this.icon ?? "");
        }

        setLabel() {
            this.contentSpan.textContent = this.label;
            this.setTitle();
        }

        setAccelerator() {
            if(!this.key)
                return;

            this.acceleratorSpan.textContent = this.formattedAccelerator ?? "";
            this.setTitle();

            // Keyboard accelerator.
            var accelerator = this.modifier
                ? this.supportedModifier + "+" + this.supportedKey
                : this.supportedKey;

            Mousetrap.bind(accelerator, e => {
                if(!this.disabled)
                    this.click();

                return false;
            });
        }

        setTitle() {
            const accelerator = this.formattedAccelerator ? `(${this.formattedAccelerator})` : "";
            let title = this.title ?? this.label ?? "";

            this.button.setAttribute("title", `${title} ${accelerator}`);
        }

        setAcceleratorWidth(value) {
            this.acceleratorSpan.style.width = value + "px";
        }
    }

    customElements.define("fluent-app-bar-button", FluentAppBarButton);
})();

(function() {
    const template = document.createElement("template");
    template.innerHTML = `
    <style>
    :host {
        background-color: #e5e5e5;
        display: block;
        height: 30px;
        min-height: 30px;
        width: 1px;
    }

    :host([horizontal]) {
        height: 1px;
        min-height: 1px;
        width: 100%;
    }
    </style>
    `;

    class FluentAppBarSeparator extends HTMLElement {
        constructor() {
            super();

            this.attachShadow({ mode: "open" });
            this.shadowRoot.append(template.content.cloneNode(true));
        }
    }

    customElements.define("fluent-app-bar-separator", FluentAppBarSeparator);
})();

(function() {
    const template = document.createElement("template");
    template.innerHTML = `
    <style>
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
        color: #1b1b1b;
        cursor: default;
        display: none;
        height: 100%;
        min-height: 36px;
        padding: 0 3px;
        position: relative;
    }
    
    .more-button:hover {
        background-color: rgba(156, 156, 156, 0.1);
    }
    
    .more-button:active {
        background-color: rgba(160, 160, 160, 0.06);
        color: rgba(27, 27, 27, 0.49) !important;
    }
    
    .more-button fluent-symbol-icon {
        margin: 0 8px;
    }

    /* Secondary commands */
    .secondary-commands {
        background-color: #fff;
        border-radius: 5px;
        box-shadow: 0 0 2px rgba(0, 0, 0, 0.2), 0 calc(32 * 0.5px) calc((32 * 1px)) rgba(0, 0, 0, 0.24);
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
        border-top: solid 1px #e5e5e5;
    }

    .collapsed-commands fluent-app-bar-separator:first-child {
        display: none;
    }
    </style>
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

    class FluentCommandBar extends HTMLElement {
        constructor() {
            super();

            this.attachShadow({ mode: "open" });
            this.shadowRoot.append(template.content.cloneNode(true));

            this.setCommandAppearance = this.setCommandAppearance.bind(this);
            this.handleSlotChange = this.handleSlotChange.bind(this);
            this.autoAdjust = this.autoAdjust.bind(this);

            this.isMovingCommand = false;
            this.lastVisibleCommandIndex = 0;
        }

        static get observedAttributes() {
            return ["is-open", "default-label-position"];
        }

        /* Attributes */
        get defaultLabelPosition() {
            return this.getAttribute("default-label-position") ?? "right";
        }

        set defaultLabelPosition(value) {
            this.setAttribute("default-label-position", value);
            this.setLabelPosition();
        }

        get isOpen() {
            return this.hasAttribute("is-open") && eval(this.getAttribute("is-open"));
        }

        /* DOM */
        get commandBar() {
            this._commandBar ??= this.shadowRoot.querySelector(".command-bar");
            return this._commandBar;
        }

        get primaryCommandsContainer() {
            this._primaryCommandsContainer ??= this.shadowRoot.querySelector(".primary-commands");
            return this._primaryCommandsContainer;
        }

        get primaryCommandsSlot() {
            this._primaryCommandsSlot ??= this.shadowRoot.querySelector(".primary-commands slot");
            return this._primaryCommandsSlot;
        }

        get moreButton() {
            this._moreButton ??= this.shadowRoot.querySelector(".more-button");
            return this._moreButton;
        }

        get secondaryCommandsSlot() {
            this._secondaryCommandsSlot ??= this.shadowRoot.querySelector("slot[name=secondary-commands]");
            return this._secondaryCommandsSlot;
        }

        get collapsedCommandsContainer() {
            this._collapsedCommandsContainer ??= this.shadowRoot.querySelector(".collapsed-commands");
            return this._collapsedCommandsContainer;
        }

        connectedCallback() {
            // Event listeners
            this.moreButton.addEventListener("click", e => {
                this.setAttribute("is-open", !this.isOpen);
                e.stopPropagation();
            });

            this.primaryCommandsSlot.addEventListener("slotchange", this.handleSlotChange);

            this.secondaryCommandsSlot.addEventListener("slotchange", e => {
                this.secondaryContainer = this.secondaryCommandsSlot.assignedNodes()[0];

                this.setMoreButtonVisibility();

                if(!this.secondaryContainer)
                    return;

                var commands = this.secondaryContainer.querySelectorAll("fluent-app-bar-button");
                var separators = this.secondaryContainer.querySelectorAll("fluent-app-bar-separator");

                // Calculate width of accelerator labels based on longest length.
                const longest = Array.from(commands).reduce((a, b) => a.formattedAccelerator.length > b.formattedAccelerator.length ? a : b);
                const acceleratorWidth = longest.formattedAccelerator.length * 6;

                commands.forEach(command => {
                    command.toggleAttribute("is-secondary", true);
                    command.setAcceleratorWidth(acceleratorWidth);
                });

                separators.forEach(separator => {
                    separator.toggleAttribute("horizontal", true);
                });
            });

            this.parentResizeObserver = new ResizeObserver(() => this.autoAdjust());
            this.parentResizeObserver.observe(this.parentElement);

            window.addEventListener("click", () => {
                this.toggleAttribute("is-open", false);
            });
        }

        attributeChangedCallback(name, oldValue, newValue) {
            switch (name) {
                case "is-open": this.setIsOpen(); break;
                case "default-label-position": this.setLabelPosition(); break;
            }
        }

        disconnectedCallback() {
            this.parentResizeObserver.disconnect();
        }

        setLabelPosition() {
            if(!["bottom", "collapsed", "right"].includes(this.defaultLabelPosition))
                return;

            var appearance = this.defaultLabelPosition;

            if(appearance === "bottom" && !this.isOpen) {
                appearance = "collapsed";
            }

            if(this.setCommandAppearance(appearance))
                return;

            // Waits for primary commands to be stored, then set appearance.
            const waitInterval = setInterval(() => {
                clearInterval(waitInterval);
                this.setCommandAppearance(appearance);
            }, 50);
        }

        setCommandAppearance(appearance) {
            if(this.primaryCommands) 
            {
                this.primaryCommands.forEach(command => {
                    command.setAttribute("appearance", appearance);
                });

                return true;
            }

            return false;
        }

        setMoreButtonVisibility() {
            const hasCommands = (this.secondaryContainer && this.secondaryContainer.children.length) || this.collapsedCommandsContainer.children.length;
            this.moreButton.style.display = hasCommands ? "flex" : "none";
        }

        setIsOpen() {
            this.commandBar.classList.toggle("active", this.isOpen);
            this.setLabelPosition();
        }

        handleSlotChange() {
            const nodes = this.primaryCommandsSlot.assignedNodes();
            this.primaryCommands = nodes.filter(command => command instanceof HTMLElement && (command.nodeName === "FLUENT-APP-BAR-BUTTON"));

            if (!this.isMovingCommand) {
                this.style.opacity = 0;

                this.primaryCommandsStore = this.primaryCommands.map(command => ({
                    parent: command.parentElement,
                    self: command,
                    previous: command.previousElementSibling,
                    bounds: command.getClientRects()[0].right - this.getClientRects()[0].left
                }));
                this.lastVisibleCommandIndex = this.primaryCommands.length - 1;

                // Waits for primary commands to be stored, then do initial auto adjusting.
                const initialAdjustInterval = setInterval(() => {
                    if (this.primaryCommandsStore) {
                        clearInterval(initialAdjustInterval);
                        this.primaryCommandsStore.forEach(this.autoAdjust);
                        this.setMoreButtonVisibility();
                        this.style.opacity = 1;
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
            const potentialWidth = parentWidth - (this.getLeft() + MORE_BTN_WIDTH + COMMAND_BAR_PADDING);

            const index = this.lastVisibleCommandIndex;
            const rightIndex = Math.min(store.length - 1, index + 1);

            const command = store[index];
            const rightCommand = store[rightIndex];

            if(index >= 0 && command.bounds > potentialWidth)
            {
                this.moveCommands(command.self, this, this.collapsedCommandsContainer);
                this.lastVisibleCommandIndex -= 1;

                if(index > 0 && command.previous.nodeName === "FLUENT-APP-BAR-SEPARATOR")
                    this.moveCommands(command.previous, this, this.collapsedCommandsContainer);
            }

            if(rightIndex !== index && rightCommand.bounds < potentialWidth) 
            {
                if(rightIndex > 0 && rightCommand.previous.nodeName === "FLUENT-APP-BAR-SEPARATOR")
                    this.moveCommands(rightCommand.previous, this.collapsedCommandsContainer, this);

                this.moveCommands(rightCommand.self, this.collapsedCommandsContainer, this);
                this.lastVisibleCommandIndex = rightIndex;
            }
        }

        getLeft() {
            if (!this.previousElementSibling) 
                return 0;

            const parentLeft = this.parentElement.getClientRects()[0].left;
            const siblingRight = this.previousElementSibling.getClientRects()[0].right;

            return siblingRight - parentLeft;
        }

        moveCommands(command, origin, destination) {
            const collapse = origin === this;

            this.isMovingCommand = true;

            origin.removeChild(command);

            if(collapse) 
            {
                const firstSibling = destination.firstChild;
                destination.insertBefore(command, firstSibling);
            }
            else 
            {
                destination.appendChild(command);
            }

            this.toggleAttributes(command, collapse);
            this.setMoreButtonVisibility();
        }

        toggleAttributes(command, toggle) {
            let attribute;

            switch(command.nodeName) {
                case "FLUENT-APP-BAR-BUTTON": attribute = "is-secondary"; break;
                case "FLUENT-APP-BAR-SEPARATOR": attribute = "horizontal"; break;
            }

            command.toggleAttribute(attribute, toggle);
        }
    }

    customElements.define("fluent-command-bar", FluentCommandBar);
})();