import InputBase, { IInputBase, ICharacter } from './InputBase';
import { InputOptions } from '../settings/detectModel';
import { IDefaultFraction } from '../settings/defaultSettings';

export interface IFractionInput extends IInputBase { }

export default class FractionInput<T> extends InputBase<InputOptions<IDefaultFraction>> implements IFractionInput {

    private _pointerChar: ICharacter | null = null;
    private _min: number = 0;
    private _max: number = 0;

    constructor(options) {
        super(options);
        this.init(true);
    }

    private _getPointerPosition(): number {
        return this._pointerChar ?
            this.characters.indexOf(this._pointerChar) :
            this.characters.length;
    }

    private _getUserInput(): string {
        return this.characters.filter((c: ICharacter) => c.isUserInput)
            .map((c: ICharacter) => c.value).join('');
    }

    private _pastePointer(): boolean {
        if (!this._pointerChar) {
            return false;
        }
        const { position } = this.cursor;
        const pointerPosition = this._getPointerPosition();
        if (position <= pointerPosition) {
            Object.assign(this._pointerChar, {
                isUserInput: true
            });
            Object.assign(this.cursor, {
                position: pointerPosition + 1
            });
            this._stateChanged(false);
            return true;
        }
        return false;
    }

    private _isCompleted(): boolean {
        return this.characters.every((c: ICharacter) => c.isUserInput);
    }

    private _stateChanged(shouldUpdatePosition: boolean = true): void {

        if (this._pointerChar && shouldUpdatePosition) {
            const fractionPart: ICharacter[] = this.characters.slice(this._getPointerPosition() + 1, this.characters.length);
            Object.assign(this._pointerChar, {
                isUserInput: fractionPart.some((c: ICharacter) => c.isUserInput)
            });
        }

        // ensure to be at least one symbol in integer part
        const integerPart: ICharacter[] = this.characters.slice(0, this._getPointerPosition());
        if (integerPart.length === 0) {
            const defaultChar: ICharacter = this.createDefaultCharacter('0', {
                displayValue: '0',
                isUserInput: false
            });
            this.characters.splice(0, 0, defaultChar);
            integerPart.splice(0, 0, defaultChar);
        }

        // exclude leading zero
        if (integerPart[0].value === '0' && integerPart.length > 1) {
            this.characters.splice(0, 1);
            this.cursor.position -= 1;
        }

        for (let i: number = this.characters.length - 1; i >= 0; i--) {
            if (this.characters[i].isUserInput) {
                const leftPart: ICharacter[] = this.characters.slice(0, i);
                leftPart.forEach((c: ICharacter) => c.isUserInput = true);
                break;
            }
        }

        // integer part
        if (this.cursor.position <= this._getPointerPosition()) {
            this.cursor.mode !== this.cursorModes.insert && (this.cursor.mode = this.cursorModes.insert);
            if (this.cursor.position === 0) {
                this.cursor.mode = this.cursorModes.replace;
            }
            return;
        }
        // fraction part if at pointer position
        if (this._getPointerPosition() === (this.cursor.position - 1) && !this.characters[this._getPointerPosition()].isUserInput) {
            this.cursor.mode = this.cursorModes.insert;
            this.cursor.position -= 1;
        } else {
            this.cursor.mode = this.cursorModes.replace;
        }
    }

    public backspace(): boolean {

        if (this.cursor.position === 0) {
            return false;
        }

        switch (this.cursor.mode) {
            case this.cursorModes.insert:
                // delete previous symbol
                if (this.cursor.position !== 0) {
                    this.characters.splice(this.cursor.position - 1, 1);
                    this.cursor.position -= 1;
                }
                break;
            case this.cursorModes.replace:
                // replace last symbol on default symbol if fractional part is fully completed and leave
                // the cursor at the same position to correct filling deleted symbol in other case decremet cursor position
                if (this._pointerChar && this._pointerChar.isUserInput) {
                    this.cursor.position = this._isCompleted() || this._getPointerPosition() === this.cursor.position - 1 ?
                        this.cursor.position : --this.cursor.position;
                    this.characters.splice(this.cursor.position, 1, this.createDefaultCharacter('0', {
                        displayValue: '0',
                        isUserInput: false
                    }));
                }
                break;
            default:
                break;
        }

        this._stateChanged();
        return true;
    }
    public init(shouldSetValue: boolean): void {

        Object.assign(this.cursor, {
            mode: this.cursorModes.replace,
            position: 0
        });

        const { min, max, scale} = this.options;

        this.characters.push(this.createDefaultCharacter('0', {
            displayValue: '0',
            isUserInput: false
        }));
        if (scale > 0) {
            this._pointerChar = this.createDefaultCharacter('.', {
                displayValue: this.options.pointer,
                isUserInput: false
            });
            this.characters.push(this._pointerChar);
            for (let i = 0; i < scale; i++) {
                this.characters.push(this.createDefaultCharacter('0', {
                    displayValue: '0',
                    isUserInput: false
                }));
            }
        }

        this._min = min;
        this._max = max;

        shouldSetValue && this.options.value && this.paste(this.options.value);
    }
    public pasteChar(character: string): boolean {
        if (!/\d/.test(character)) {
            // define all non-numeric symbols as pointer
            return this._pastePointer();
        }

        const newChar: ICharacter = this.createDefaultCharacter(character, {
            displayValue: this.options.isPwd ? this.options.pwdChar : character
        });
        const isIntegerPart: boolean = this.cursor.position < this._getPointerPosition();

        switch (this.cursor.mode) {
            case this.cursorModes.insert:
                this.characters.splice(this.cursor.position, 0, newChar);
                this.cursor.position++;
                break;
            case this.cursorModes.replace:
                this.characters.splice(this.cursor.position, 1, newChar);
                (isIntegerPart || this.cursor.position < this.characters.length - 1) && this.cursor.position++;
                break;
            default:
                break;
        }

        this._stateChanged();
        return true;
    }
    public checkUserInput(): boolean {
        return this.characters.some((c: ICharacter) => c.isUserInput);
    }
    public getValue(): string {
        return this.characters.map((c: ICharacter) => c.value).join('');
    }
    public checkValidation(): boolean {
        const value: string = this._getUserInput();
        const { isRequired, precision } = this.options;

        if (isRequired) {
            if (!value.length) {
                return false;
            }
        }

        if (precision) {
            if (value.length > precision) {
                return false;
            }
        }

        return parseFloat(value) >= this._min && parseFloat(value) <= this._max;
    }
}
