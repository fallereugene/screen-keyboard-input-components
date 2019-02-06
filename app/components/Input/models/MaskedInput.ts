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

        // Разобрать каждый символ маски
        let isChangableGroup: boolean = false;
        let isMandatoryGroup: boolean = false;

        maskStr.split('').forEach((c: string): void => {
            switch (c) {
                // Управляющие символы
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

                // Неуправляющие символы
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

    private _getIndex(type: string): number {
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
        this.characters.slice(0, this.cursor.position).map((c: ICharacter) => c.isUserInput = true);
    }

    private _isDigit(c: string): boolean {
        return /\d/.test(c);
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

        this._lastEditableIndex = this._getIndex('editable');
        this._lastRequiredIndex = this._getIndex('required');

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
            displayValue: character
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

