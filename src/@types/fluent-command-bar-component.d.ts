import { CustomComponent } from '@sagemodeninja/custom-component';

declare module '@sagemodeninja/fluent-command-bar-component' {
    export class FluentCommandBar extends CustomComponent {
        defaultLabelPosition: 'bottom' | 'collapsed' | 'right';
        isOpen: boolean;
        customMenu: boolean;
        commands: FluentAppBarButton[];
    }

    export class FluentAppBarButton extends CustomComponent {
        icon: string;
        label: string;
        command: string;
        modifier: string;
        key: string;
    }
}
