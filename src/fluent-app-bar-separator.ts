import { CustomComponent, customComponent } from '@sagemodeninja/custom-component';

@customComponent('fluent-app-bar-separator')
export class FluentAppBarSeparator extends CustomComponent {
    static styles = `
        :host {
            background-color: var(--stroke-divider-default);
            box-sizing: border-box;
            display: block;
            height: 30px;
            width: 1px;
        }

        :host([horizontal]) {
            height: 1px;
            min-height: 1px;
            width: 100%;
        }
    `;

    render(): string {
        return ``;
    }
}
