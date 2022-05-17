(function() {
    const template = document.createElement("template");
    template.innerHTML = `
    <style>
    :host {
        display: inline-block;
        user-select: none;
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
    }
    
    .button fluent-symbol-icon,
    .button ::slotted(*) {
        margin-right: 5px;
    }
    
    /* Content */
    .content {
        flex-grow: 1;
        font-family: 'Segoe UI Variable Small', sans-serif;
        font-size: 12px;
        font-weight: 400;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    </style>
    <div class='button'>
        <fluent-symbol-icon class='icon'></fluent-symbol-icon>
        <slot name='icon'>
        </slot>
        <span class='content'></span>
    </div>
    `;

    class FluentAppBarButton extends HTMLElement {
        constructor() {
            super();

            this.attachShadow({ mode: "open" });
            this.shadowRoot.append(template.content.cloneNode(true));
        }

        static get observedAttributes() {
            return ["icon", "label"];
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

        connectedCallback() {
            this.setIcon();
            this.setLabel();
            
            // Event listeners
            this.customIconSlot.addEventListener("slotchange", e => {
                const hasCustomIcons = this.customIconSlot.assignedNodes().length > 0;

                this.iconSpan.style.display = hasCustomIcons ? "none" : "inline-block";
                this.customIconSlot.style.display = hasCustomIcons ? "default" : "none";
            });
        }
        
        attributeChangedCallback(name, oldValue, newValue) {
            switch (name) {
                case "icon": this.setIcon(); break;
                case "label": this.setLabel(); break;
            }
        }

        setIcon() {
            this.iconSpan.setAttribute("symbol", this.icon);
        }

        setLabel() {
            this.contentSpan.textContent = this.label;
        }
    }

    customElements.define("fluent-app-bar-button", FluentAppBarButton);
})();