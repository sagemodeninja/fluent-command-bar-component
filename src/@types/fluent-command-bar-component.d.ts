import { CustomComponent } from '@sagemodeninja/custom-component';

declare module '@sagemodeninja/fluent-command-bar-component' {
    export type CommandState = { [command: string]: boolean }

    export class FluentCommandBar extends CustomComponent {
        defaultLabelPosition: 'bottom' | 'collapsed' | 'right';
        isOpen: boolean
        customMenu: boolean
        commands: FluentAppBarButton[]

        toggleDisabled(state: CommandState): void
        toggleHidden(state: CommandState): void
    }

    export class FluentAppBarButton extends CustomComponent {
        icon: string;
        label: string;
        command: string;
        modifier: string;
        key: string;
    }
}
