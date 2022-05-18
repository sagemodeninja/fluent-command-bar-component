(function() {
    const template = document.createElement("template");
    template.innerHTML = `
    <style>
    :host {
        display: inline-block;
        user-select: none;
    }

    :host([is-secondary]) {
        display: block;
        margin: 4px;
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
        padding: 0 10px;
        position: relative;
    }
    
    .button:hover,
    :host(.active) .button {
        background-color: rgba(156, 156, 156, 0.1);
    }
    
    .button:active {
        background-color: rgba(160, 160, 160, 0.06);
        color: rgba(27, 27, 27, 0.49) !important;
    }
    
    .button fluent-symbol-icon,
    .button ::slotted(*) {
        margin-right: 8px;
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
    </style>
    <div class='button'>
        <fluent-symbol-icon class='icon'></fluent-symbol-icon>
        <slot name='icon'>
        </slot>
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
        
        /* DOM */
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
            return this.key.toLowerCase().replace("delete", "del").replace("+", "=");
        }

        connectedCallback() {
            this.setIcon();
            this.setLabel();
            
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
        }

        setAccelerator() {
            if(!this.key)
                return;

            this.acceleratorSpan.textContent = this.formattedAccelerator ?? "";

            var accelerator = this.modifier && this.key
                ? this.supportedModifier + "+" + this.supportedKey
                : this.supportedKey;

            Mousetrap.bind(accelerator, e => {
                this.click();
                return false;
            });
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
        user-select: none;
    }

    .command-bar {
        border-radius: 4px;
        box-sizing: border-box;
        padding: 6px 1px 6px 6px;
        position: relative;
    }

    .command-bar.active {
        background-color: #fff;
        border: solid 1px #ebebeb;
        padding: 5px;
    }

    .command-bar,
    .primary-commands {
        align-items: center;
        column-gap: 5px;
        display: flex;
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
        padding: 0 3px;
        position: relative;
    }
    
    .button:hover {
        background-color: rgba(156, 156, 156, 0.1);
    }
    
    .button:active {
        background-color: rgba(160, 160, 160, 0.06);
        color: rgba(27, 27, 27, 0.49) !important;
    }
    
    .button fluent-symbol-icon {
        margin: 0 8px;
    }

    /* Secondary commands */
    .secondary-commands {
        background-color: #f7f7f7;
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
    </style>
    <div class='command-bar'>
        <div class='primary-commands'>
            <slot></slot>
        </div>
        <div class='button more-button'>
            <fluent-symbol-icon symbol='More' font-size="20" title="See more"></fluent-symbol-icon>
        </div>
        <div class='secondary-commands'>
            <slot name='secondary-commands'></slot>
        <div>
    </div>
    `;

    class FluentCommandBar extends HTMLElement {
        constructor() {
            super();

            this.attachShadow({ mode: "open" });
            this.shadowRoot.append(template.content.cloneNode(true));
        }

        static get observedAttributes() {
            return ["is-open"];
        }

        /* Attributes */
        get isOpen() {
            return this.getAttribute("is-open");
        }

        set isOpen(value) {
            this.setAttribute("is-open", value);
            this.setIsOpen();
        }
        
        /* DOM */
        get commandBar() {
            this._commandBar ??= this.shadowRoot.querySelector(".command-bar");
            return this._commandBar;
        }
        
        get moreButton() {
            this._moreButton ??= this.shadowRoot.querySelector(".more-button");
            return this._moreButton;
        }
        
        get secondaryCommandsSlot() {
            this._secondaryCommandsSlot ??= this.shadowRoot.querySelector("slot[name=secondary-commands]");
            return this._secondaryCommandsSlot;
        }

        connectedCallback() {
            this.setIsOpen();

            // Event listeners
            this.moreButton.addEventListener("click", e => {
                this.toggleAttribute("is-open");
                e.stopPropagation();
            });

            this.secondaryCommandsSlot.addEventListener("slotchange", e => {
                var container = this.secondaryCommandsSlot.assignedNodes()[0];
                var commands = container.querySelectorAll("fluent-app-bar-button");
                var separators = container.querySelectorAll("fluent-app-bar-separator");
                
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

            window.addEventListener("click", () => {
                this.toggleAttribute("is-open", false);
            });
        }
        
        attributeChangedCallback(name, oldValue, newValue) {
            switch (name) {
                case "is-open": this.setIsOpen(); break;
            }
        }

        setIsOpen() {
            this.commandBar.classList.toggle("active", eval(this.isOpen));
        }
    }

    customElements.define("fluent-command-bar", FluentCommandBar);
})();