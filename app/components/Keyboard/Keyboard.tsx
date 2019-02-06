import './styles.scss';

import * as React from 'react';
import cx from 'classnames';

import Layout from './Layout';

import { INumLayouts } from './config/layouts/numeric';
import { IFullLayouts } from './config/layouts/full';

export interface IProps {
    className?: string;
    layout: LayoutType;
    keyboardEventEmitter: {
        emit(s: any): void;
    };
}

export interface IKeyboard {
    state: IState;
}

export interface IState {
    previousLayout: string;
    layout: string;
}

type LayoutType = INumLayouts | IFullLayouts;

export default class Keyboard extends React.Component<IProps, IState> implements IKeyboard {

    public state: IState = {
        previousLayout: '',
        layout: ''
    };

    constructor(props: IProps) {
        super(props);

        const layout: string = Object.keys(props.layout)[0];
        this.state = {
            layout
        } as IState;
        this.onClick = this.onClick.bind(this);
        this.onActionClick = this.onActionClick.bind(this);
    }

    private onActionClick(action: string[]): void {
        const [keyAction, param] = action;
        switch (keyAction) {
            case 'bksp':
                this.props.keyboardEventEmitter.emit({
                    keyCode: 8,
                    preventDefault: () => { /* */ }
                });
                break;
            case 'clear':
                this.props.keyboardEventEmitter.emit({
                    keyCode: 46,
                    preventDefault: () => { /* */ }
                });
                break;
            case 'space':
                this.props.keyboardEventEmitter.emit('&nbsp;');
                break;
            case 'shift':
            case 'lang':
                if (!param) {
                    console.warn(`Target layout not specified for ${param} action`);
                    return;
                }
                this.setState({
                    layout: param
                });
                break;
            case 'num':
                if (this.state.layout === keyAction) {
                    this.setState({
                        layout: this.state.previousLayout
                    });
                    return;
                }
                this.setState({
                    previousLayout: this.state.layout,
                    layout: keyAction
                });
                break;
            default:
                break;
        }
    }

    private onClick(symbol: string): void {
        this.props.keyboardEventEmitter.emit(symbol);
    }

    public render(): JSX.Element {
        const { className, layout } = this.props;
        return (
            <div>
                <Layout
                    layout={layout[this.state.layout]}
                    layoutName={this.state.layout}
                    onActionClick={this.onActionClick}
                    onClick={this.onClick}
                    className={cx('keyboard', className)}
                />
            </div>
        );
    }
}
