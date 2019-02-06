import './styles.scss';

import * as React from 'react';
import cx from 'classnames';
import Button from '@components/Button';

interface IProps {
    layoutName: string;
    layout: string[];
    onActionClick(action: string[]): void;
    onClick(symbol: string): void;
    className?: string;
}

interface IParsedAction {
    action: string[] | null;
    name: string;
}

export default class Layout extends React.Component<IProps> {

    private _parseAction(symbol: string): IParsedAction {

        if (!/^\{\S+\}$/.test(symbol) && !/^\[\S+\}$/.test(symbol)) {
            return {
                name: symbol,
                action: null
            };
        }

        let nameToShow, action;
        const hasBraket = symbol.includes(']');
        let actionString: any = symbol;

        if (hasBraket) {
            actionString = symbol.split(']') as string[];
            nameToShow = actionString.shift().substr(1) as string;
        }

        action = actionString
            .toString().match(/^\{(\S+)\}$/)[1].split(':') as string[];

        return {
            action,
            name: nameToShow || action[0]
        } as IParsedAction;
    }

    private _buildRow(rowSymbols: string[], row: number): JSX.Element {
        const { onActionClick, layoutName, onClick } = this.props;
        return (
            <div
                className={`row row__${row + 1}`}
                key={`row${row}`}>
                {rowSymbols.map((symbol: string, index: number): JSX.Element => {
                    const { action, name } = this._parseAction(symbol);
                    return (
                        <Button
                            className='btn'
                            key={`${layoutName}${index}`}
                            onClick={() => { action ? onActionClick(action) : onClick(name); }}
                            data-value={name}
                            text={name}
                        />
                    );
                })}
            </div>
            );
    }

    public render(): JSX.Element {
        const { layout, layoutName, className } = this.props;
        return (
            <div className={cx(className, `layout-${layoutName}`)}>
                {layout.map((symbols: string, row: number): JSX.Element => {
                    let rowSymbols: string[] = symbols.split(' ');
                    return this._buildRow(rowSymbols, row);
                })}
            </div>
        );
    }
}
