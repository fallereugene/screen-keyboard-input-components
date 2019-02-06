import './styles.scss';

import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import cx from 'classnames';
import { createStringFromSymbol } from '@core/utils';
import detectModel from './settings/detectModel';

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

interface IInput {}

export default class Input extends React.Component<IProps, {}, {}> {

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

    public onPaste(e): boolean {
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

    public onBackspace() {
        return this._viewModel.backspace();
    }

    public onKey(e) {
        if (!e) {
            return;
        }
        if (typeof e === 'object') {
            if (e.type === 'keypress') {
                return;
            }
            this.onPaste(e.keyCode) && this.forceUpdate();
        } else {
            this._viewModel.pasteChar(createStringFromSymbol(e.toString())) && this.forceUpdate();
        }
    }

    public createCharElement(charModel, keySpan) {
        const notEditableClass = this._viewModel.options.notEditableClass;
        const notUserInputClass = this._viewModel.options.notUserInputClass;
        let toRender =
            <span
                key={keySpan}
                className={cx({
                    [notEditableClass]: !charModel.isEditable,
                    [notUserInputClass]: !charModel.isUserInput
                })}>{charModel.displayValue}</span>;
        return ReactDOMServer.renderToStaticMarkup(toRender);
    }

    public drawCharacters(vmState): string {
        return vmState.characters.map((charModel, idx) => this.createCharElement(charModel, idx)).join('');
    }

    render(): JSX.Element {
        const vmState = this._viewModel.getState();
        const toRender = this.drawCharacters(vmState);
        return (
            <div
                className='input-field'
                dangerouslySetInnerHTML={{ __html: toRender }}
            />
        );
    }
}

