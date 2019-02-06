import cursorModes from './cursorModes';

export default abstract class InputBase<TParams extends IBaseParams> implements IInputBase {

    protected options: TParams;
    protected characters: ICharacter[];
    protected cursor: ICursor;
    protected cursorModes: ICursorModes = {
        insert: 0,
        replace: 1,
        replaceAll: 2
    };

    constructor(options: TParams) {
        this.options = options;
        this.characters = [];
        this.cursor = {
            position: 0,
            mode: this.cursorModes.insert
        };
    }

    protected createDefaultCharacter(character: string, options?: { [key: string]: any }): ICharacter {
        return {
            displayValue: character,
            value: character,
            isUserInput: true,
            isEditable: true,
            ...options
        };
    }

    public clear(): boolean {
        if (!this.checkUserInput()) {
            return false;
        }
        this.characters = [];
        this.init(false);
        return true;
    }

    public getState(): IState {
        return {
            characters: this.characters,
            isValid: this.checkValidation(),
            hasUserInput: this.checkUserInput(),
            value: this.getValue()
        };
    }


    public paste(text: string): boolean {

        let isChanged: boolean = false;

        let chars: string[] = text.split('');
        chars.map((char: string) => isChanged = this.pasteChar(char));

        return isChanged;
    }

    abstract getValue(): string;
    abstract checkUserInput(): boolean;
    abstract init(shouldSetValue: boolean): void;
    abstract backspace(): boolean;
    abstract pasteChar(character): boolean;
    abstract checkValidation(): boolean;
}

export interface IBaseParams {
    mode: string;
    value: string;
    isRequired: boolean;
}

export interface IInputBase {
    clear(): boolean;
    getState(): IState;
    paste(text: string): boolean;
    getValue(): string;
    checkUserInput(): boolean;
    init(shouldSetValue: boolean): void;
    backspace(): boolean;
    pasteChar(character): boolean;
    checkValidation(): boolean;
}

export interface ICharacter {
    displayValue: string;
    isEditable: boolean;
    isUserInput: boolean;
    value: string;
}

export interface IState {
    characters: ICharacter[];
    isValid: boolean;
    hasUserInput: boolean;
    value: string;
}

export interface ICursor {
    position: number;
    mode: number;
}

export interface ICursorModes {
    insert: number;
    replace: number;
    replaceAll: number;
}
