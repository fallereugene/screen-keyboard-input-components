import InputBase, { IInputBase, ICharacter, ICursor } from './InputBase';
import { InputOptions } from '../settings/detectModel';
import { IDefaultMask, IMask, IMaskDefinitions, IMaskReplacements } from '../settings/defaultSettings';

enum CharTypes {
    any,
    letter,
    digit,
    unknown
}

export interface IMaskedInput extends IInputBase { }

export default class MaskedInput<T> extends InputBase<InputOptions<IDefaultMask>> implements IMaskedInput {

    private _mask: IMaskedChar[] = [];
    private _lastRequiredIndex: number = 0;
    private _isCursorInLastPosition: boolean = false;
    private _lastEditableIndex: number = 0;
    private _isDate: boolean = false;

    constructor(options) {
        super(options);
        this.init(true);
    }

    private _parseMask(
        maskStr: string,
        changableGroupSyntax: IMask,
        mandatoryGroupSyntax: IMask,
        formatCharDef: IMaskDefinitions,
        replacements: IMaskReplacements) {

        let mask: IMaskedChar[] = [];

        // parse each mask's character
        let isChangableGroup: boolean = false;
        let isMandatoryGroup: boolean = false;

        maskStr.split('').forEach((c: string): void => {
            switch (c) {
                case changableGroupSyntax.start:
                    isChangableGroup = true;
                    break;
                case changableGroupSyntax.end:
                    isChangableGroup = false;
                    break;
                case mandatoryGroupSyntax.start:
                    isMandatoryGroup = true;
                    break;
                case mandatoryGroupSyntax.end:
                    isMandatoryGroup = false;
                    break;
                default:
                    let maskChar: IMaskedChar = this._parseMaskChar(c, formatCharDef, isChangableGroup, isMandatoryGroup, replacements);
                    mask.push(maskChar);
            }
        });

        return mask;
    }

    private _parseMaskChar(
        formatChar: string,
        formatCharDef: IMaskDefinitions,
        isEditable: boolean,
        isMandatory: boolean,
        replacements: IMaskReplacements): IMaskedChar {
        let maskChar: IMaskedChar = {
            type: CharTypes.any,
            displayValue: formatChar,
            isRequired: false,
            isEditable,
            isMandatory
        };

        if (!isEditable) {
            return maskChar;
        }

        let displayValue: string = formatChar;
        let charType: number;
        let isRequired: boolean;

        switch (formatChar) {
            case formatCharDef.chr:
            case formatCharDef.chrOpt:
                charType = CharTypes.letter;
                isRequired = formatChar === formatCharDef.chr;
                break;
            case formatCharDef.digit:
            case formatCharDef.digitOpt:
                charType = CharTypes.digit;
                isRequired = formatChar === formatCharDef.digit;
                break;
            case formatCharDef.any:
            case formatCharDef.anyOpt:
                charType = CharTypes.any;
                isRequired = formatChar === formatCharDef.any;
                break;
            default:
                charType = CharTypes.unknown;
                isRequired = false;
                break;
        }

        Object.assign(maskChar, {
            isEditable: isEditable && charType !== CharTypes.unknown
        });

        Object.assign(maskChar, {
            type: charType,
            isMandatory: true,
            displayValue: charType === CharTypes.unknown ?
                replacements.unknown : replacements[formatChar],
            isRequired
        });

        return maskChar;
    }

    private _getNextEditablePosition(startPosition: number, right: boolean): number {
        let currentPosition: number = right ? startPosition + 1 : startPosition - 1;
        while (currentPosition >= 0 && currentPosition < this._mask.length) {
            let currentChar: IMaskedChar = this._mask[currentPosition];
            if (currentChar && currentChar.isEditable) {
                return currentPosition;
            }

            right ? currentPosition++ : currentPosition--;
        }
        return startPosition;
    }

    private _getLastIndex(type: string): number {
        let idx: number = 0;
        for (let i = this._mask.length - 1; i >= 0; i--) {
            let maskedChar: IMaskedChar = this._mask[i];
            const condition = type === 'editable' ?
                maskedChar.isEditable : (maskedChar.isRequired && maskedChar.isMandatory);
            if (condition) {
                idx = i;
                break;
            }
        }
        return idx;
    }

    private _getFirstEditableIndex(): number {
        let result: number = -1;
        for (let i: number = 0; i < this._mask.length; i++) {
            if (this._mask[i].isEditable) {
                result = i;
                break;
            }
        }
        return result;
    }

    private _getLastActiveCharPosition(considerCursor: boolean = true): number {
        let result: number = -1;
        if (this.characters.length > 0) {
            // find last edited symbol
            for (let i: number = this.characters.length - 1; i >= 0; i--) {
                if (this._mask[i].isEditable && this.characters[i].isUserInput) {
                    result = i;
                    break;
                }
            }

            if (result === -1) {
                // find first position before editable symbol if there are no edited symbols
                result = this._getFirstEditableIndex() - 1;
            }

            let notEditableTail: boolean = this._mask.slice(result + 1, this._mask.length)
                .every((maskChar: IMaskedChar) => !maskChar.isEditable);

            if (notEditableTail) {
                result = this._mask.length - 1;
            }
        }

        if (considerCursor) {
            result = Math.max(result, this.cursor.position);
        }

        return result;
    }

    private _ensureMaskShown(): void {
        for (let i = 0; i < this._mask.length; i++) {
            if (!this.characters[i]) {
                const maskChar: IMaskedChar = this._mask[i];
                this.characters[i] = this.createDefaultCharacter(maskChar.displayValue, {
                    isUserInput: false,
                    isEditable: maskChar.isEditable
                });
            }
        }
    }

    private _ensureUserInput(): void {
        let lastInputChar: number = this._getLastActiveCharPosition(false);

        // All symbols should be marked as userInput = true before last edited symbol
        this.characters.slice(0, lastInputChar + 1).map((c: ICharacter) => {
            c.isUserInput = true;
        });

        this.characters.slice(lastInputChar + 1, this.characters.length).map((c: ICharacter) => c.isUserInput = false);
    }

    private _isDigit(c: string): boolean {
        return /\d/.test(c);
    }

    private _getDaysQuantity(m: number, y: number): number {
        switch (m) {
            case 1:
                return (y % 4 === 0 && y % 100) || y % 400 === 0 ? 29 : 28;
            case 8:
            case 3:
            case 5:
            case 10:
                return 30;
            default:
                return 31;
        }
    }

    private _validateDate(): boolean {
        const value: string = this.getValue();
        const { isRequired, minDate, maxDate } = this.options;

        if (!isRequired && !value.length) {
            return true;
        }

        if (this.characters[this.characters.length - 1].isUserInput) {
            const [d, m, y] = value.split('/').map((v: string) => parseInt(v, 10));
            const isValidDate = m >= 0 && m < 12 && d > 0 && d <= this._getDaysQuantity(m - 1, y);

            if (!isValidDate) {
                return false;
            }

            if (!minDate && !maxDate) {
                return true;
            }

            const userDate = new Date(y, m - 1, d);
            const userTime = userDate.getTime();
            const minTime = new Date(minDate);
            const maxTime = new Date(maxDate).getTime();
            minTime.setHours(0, 0, 0, 0);

            return userTime >= minTime.getTime() && userTime <= maxTime;
        }

        return false;
    }

    private _isLetter(c: string): boolean {
        let code: number = c.charCodeAt(0);
        let result: boolean = false;
        this.options.allowedCharCodes.map((item: number[]): void => {
            if (
                (item.length === 1 && code === item[0]) ||
                (item.length === 2 && code >= item[0] && code <= item[1])) {
                result = true;
            }
        });
        return result;
    }

    public init(shouldSetValue: boolean): void {

        const { format, mask, mandatory, definitions, replacements } = this.options;

        this._isCursorInLastPosition = false;

        this._mask = this._parseMask(format, mask, mandatory, definitions, replacements);

        this.cursor = <ICursor>{
            position: this._getNextEditablePosition(-1, true),
            mode: this.cursorModes.insert
        };

        this._lastEditableIndex = this._getLastIndex('editable');
        this._lastRequiredIndex = this._getLastIndex('required');

        this._ensureMaskShown();
        this._ensureUserInput();

        shouldSetValue && this.options.value && this.paste(this.options.value);
    }

    public getValue(): string {
        return this.characters.filter((c: ICharacter, idx: number): boolean => c.isUserInput)
            .map((c: ICharacter) => c.value).join('');
    }

    public checkUserInput() {
        return this.characters.some((c: ICharacter, idx: number) => {
            const maskedChar: IMaskedChar = this._mask[idx];
            return c.isUserInput && maskedChar.isEditable;
        });
    }

    public backspace(): boolean {

        if (this.cursor.position === 0) {
            return false;
        }

        this.cursor.position = !this._isCursorInLastPosition ?
            this._getNextEditablePosition(this.cursor.position, false) : this.cursor.position;
        let maskedChar: IMaskedChar = this._mask[this.cursor.position];
        let newChar: ICharacter = this.createDefaultCharacter(maskedChar.displayValue, {
            isUserInput: false
        });
        this.characters.splice(this.cursor.position, 1, newChar);
        this._isCursorInLastPosition && (this._isCursorInLastPosition = false);

        this._ensureMaskShown();
        this._ensureUserInput();

        return true;
    }

    public pasteChar(character: string): boolean {
        let maskedChar: IMaskedChar = this._mask[this.cursor.position];
        switch (maskedChar.type) {
            case CharTypes.letter:
                if (!this._isLetter(character)) {
                    return false;
                }
                break;
            case CharTypes.digit:
                if (!this._isDigit(character)) {
                    return false;
                }
                break;
            default:
                break;
        }

        const newChar: ICharacter = this.createDefaultCharacter(character, {
            isUserInput: true,
            displayValue: this.options.isPwd ? this.options.pwdChar : character
        });

        if (this._isCursorInLastPosition) {
            return false;
        }

        this._lastEditableIndex === this.cursor.position && (this._isCursorInLastPosition = true);
        this.characters.splice(this.cursor.position, 1, newChar);
        this.cursor.position = this._getNextEditablePosition(this.cursor.position, true);

        this._ensureMaskShown();
        this._ensureUserInput();

        return true;
    }

    public checkValidation(): boolean {
        if (this.options.isDate) {
            return this._validateDate();
        }

        let { isRequired } = this.options,
            nonRequiredMask: boolean = this._mask.every((item: IMaskedChar) => !item.isRequired);

        if (nonRequiredMask) {
            return true;
        }

        if (isRequired) {
            return this.characters[this._lastRequiredIndex].isUserInput;
        }

        const value: string = this.getValue();

        if (this.characters.every((c: ICharacter) => c.isEditable)) {
            return this.characters[this._lastRequiredIndex].isUserInput || !value;
        }

        if (!this.characters[this._getNextEditablePosition(-1, true)].isUserInput) {
            return true;
        }

        return this.characters[this._lastRequiredIndex].isUserInput;
    }

}

export interface IMaskedChar {
    displayValue: string;
    isEditable: boolean;
    isMandatory: boolean;
    isRequired: boolean;
    type: number;
}

