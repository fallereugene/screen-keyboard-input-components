import './styles.scss';

import * as React from 'react';
import cx from 'classnames';

import Input from '@components/Input';
import Keyboard from '@components/Keyboard';
import fullLayout from '@components/Keyboard/config/layouts/full';

export interface IRoot {}

const options = {
    format: '{123}[00A--0---]',
    isRequired: true,
    mode: 'mask',
    notEditableClass: 'not-editable',
    notUserInputClass: 'ghost',
    value: ''
};

export default class Root extends React.Component<any, any> {

    public keyboardEventEmitter = {
        emit(sym: any) { /* */ },
    };

    render() {
        return (
            <>
                <div className='keyboard-container'>
                    <Input
                        keyboardEventEmitter={this.keyboardEventEmitter}
                        options={options}
                    />
                    <Keyboard
                        className='testClassname'
                        layout={fullLayout}
                        keyboardEventEmitter={this.keyboardEventEmitter}
                    />
                </div>
            </>
        );
    }
}

