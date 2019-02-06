import InputBase, { IInputBase, ICharacter } from './InputBase';
import { InputOptions } from '../settings/detectModel';
import { IDefaultString } from '../settings/defaultSettings';

export interface IInputString extends IInputBase { }

export default class InputString<T> extends InputBase<InputOptions<IDefaultString>> implements IInputString {
    constructor(options) {
        super(options);
        this.options.value && this.paste(this.options.value);
    }

    public backspace(): boolean {
        if (this.cursor.position !== 0) {
            this.characters.splice(this.cursor.position - 1, 1);
            this.cursor.position -= 1;
            return true;
        }
        return false;
    }

    public init(shouldSetValue: boolean): void {
        Object.assign(this.cursor, {
            position: 0,
            mode: this.cursorModes.insert
        });
        shouldSetValue && this.options.value && this.paste(this.options.value);
    }

    public pasteChar(character: string): boolean {
        if (this.options.maxSymbolString && this.options.maxSymbolString > this.characters.length) {
            this.characters.splice(this.cursor.position, 0, this.createDefaultCharacter(character));
            this.cursor.position += 1;
            return true;
        }
        return false;
    }

    public checkUserInput(): boolean {
        return this.characters.some((c: ICharacter) => c.isUserInput);
    }

    public getValue(): string {
        return this.characters.map((c: ICharacter) => c.value).join('');
    }

    public checkValidation(): boolean {
        const { isRequired, regexp, minSymbolString } = this.options;

        if (!isRequired && !regexp && !minSymbolString) {
            return true;
        }

        const value = this.getValue();

        if (isRequired) {
            if (!value.length) {
                return false;
            }
        }

        if (regexp) {
            return new RegExp(regexp).test(value) &&
                value.length >= minSymbolString;
        }

        return value.length >= minSymbolString;
    }
}
