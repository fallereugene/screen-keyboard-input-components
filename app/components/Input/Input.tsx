import './styles.scss';

import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import cx from 'classnames';
import { createStringFromSymbol } from '@core/utils';
import detectModel from './settings/detectModel';
import { ICharacter, IState } from '@components/Input/models/InputBase';

export interface IOptions {
    mode: string;
    value: string;
    format: string;
    maxSymbolString?: number;
}

interface IProps {
    keyboardEventEmitter: {
        emit(e: any): void;
    };
    options: IOptions;
}

interface IDefaultProps {}

interface IInput {
    onPaste(e: number): boolean;
    onClear(): boolean;
    onBackspace(): boolean;
    onKey(e: string | KeyboardEvent): void;
}

export default class Input extends React.Component<IProps, {}, {}> implements IInput {

    private _viewModel;

    constructor(props: IProps) {
        super(props);
        const options = {
            ...this.props.options
        } as IOptions;
        this._viewModel = detectModel(options);
        this.props.keyboardEventEmitter.emit = (e) => {
            this.onKey(e);
        };
    }

    public onPaste(e: number): boolean {
        switch (e) {
            case 8:
                return this.onBackspace();
            case 46:
                return this.onClear();
            default:
                break;
        }
        return false;
    }

    public onClear(): boolean {
        return this._viewModel.clear();
    }

    public onBackspace(): boolean {
        return this._viewModel.backspace();
    }

    public onKey(e: string | KeyboardEvent): void {
        if (!e) {
            return;
        }
        if (typeof e === 'object') {
            if (e.type === 'keydown') {
                e.preventDefault();
                if (e.keyCode === 8 || e.keyCode === 46) {
                    this.onPaste(e.keyCode) && this.forceUpdate();
                    return;
                }
                this._viewModel.pasteChar(createStringFromSymbol(e.key.toString())) && this.forceUpdate();
            } else {
                this.onPaste(e.keyCode) && this.forceUpdate();
            }

        } else {
            this._viewModel.pasteChar(createStringFromSymbol(e.toString())) && this.forceUpdate();
        }
    }

    public createCharElement(charModel: ICharacter, keySpan: number): string {
        const notEditableClass: string = this._viewModel.options.notEditableClass;
        const notUserInputClass: string = this._viewModel.options.notUserInputClass;
        let toRender: JSX.Element =
            <span
                key={keySpan}
                className={cx({
                    [notEditableClass]: !charModel.isEditable,
                    [notUserInputClass]: !charModel.isUserInput
                })}>{charModel.displayValue}</span>;
        return ReactDOMServer.renderToStaticMarkup(toRender);
    }

    public drawCharacters(vmState): string {
        return vmState.characters.map((charModel: ICharacter, idx: number) => this.createCharElement(charModel, idx)).join('');
    }

    render(): JSX.Element {
        const vmState: IState = this._viewModel.getState();
        const toRender: string = this.drawCharacters(vmState);
        return (
            <div
                className='input-field'
                tabIndex={0}
                onKeyDown={this.onKey.bind(this)}
                dangerouslySetInnerHTML={{ __html: toRender }}
            />
        );
    }
}

