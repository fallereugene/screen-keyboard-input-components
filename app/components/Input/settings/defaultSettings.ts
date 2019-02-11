export interface IDefaults {
    mode: string;
    value: string;
    isRequired: boolean;
    isPwd: boolean;
    pwdChar: string;
    className: string;
}

export interface IDefaultNumber { }

export interface IDefaultString {
    minSymbolString: number;
    maxSymbolString: number;
    regexp: string;
}

export interface IDefaultMask {
    format: string;
    isRequired: boolean;
    isDate: boolean;
    minDate: string;
    maxDate: string;
    mask: IMask;
    mandatory: IMask;
    definitions: IMaskDefinitions;
    replacements: IMaskReplacements;
    allowedCharCodes: number[][];
    notEditableClass: string;
    notUserInputClass: string;
}

export interface IMask {
    start: string;
    end: string;
}

export interface IMaskDefinitions {
    chr: string;
    chrOpt: string;
    digit: string;
    digitOpt: string;
    any: string;
    anyOpt: string;
}

export interface IMaskReplacements {
    A: string;
    a: string;
    0: string;
    9: string;
    _: string;
    '-': string;
    unknown: string;
}

export interface IDefaultFraction {
    scale: number;
    pointer: string;
    min: number;
    max: number;
    precision: number;
}

const defaultSettings = {
    defaults: {
        mode: 'string',
        value: '',
        isRequired: false,
        isPwd: false,
        pwdChar: '*',
        className: ''
    },
    defaultsNumber: {},
    defaultsString: {
        maxSymbolString: 10,
        minSymbolString: 0,
        regexp: ''
    },
    defaultsMask: {
        format: '',
        isRequired: false,
        isDate: false,
        minDate: '',
        maxDate: '',
        mask: {
            start: '[',
            end: ']'
        },
        mandatory: {
            start: '{',
            end: '}'
        },
        definitions: {
            chr: 'A',
            // обязательная буква
            chrOpt: 'a',
            // необязательная буква (допускается только в конце маски)
            digit: '0',
            // обязательная цифра
            digitOpt: '9',
            // необязательная цифра (допускается только в конце маски)
            any: '_',
            // обязательный любой символ
            anyOpt: '-'
            // необязательный любой символ (допускается только в конце маски)
        },
        replacements: {
            'A': 'A',
            'a': 'A',
            '0': '0',
            '9': '0',
            '_': '_',
            '-': '_',
            'unknown': '#'
        },
        /**
         * Массив содержащий интервалы кодов разрешенных символов в формате Unicode.
         * Интервалы представляют собой одно- и двухэлементные массивы.
         * Первый элемент двухэлементного массива означает начало интервала кодов, второй - конец интервала.
         * Границы входят в интервал. В одноэлемнтом массиве
         * проверяется соответсвие кода символа на равенство единственному элементу массива.
         */
        allowedCharCodes: [
            [0x41, 0x5A], [0x61, 0x7A],
            [0x401], [0x410, 0x44F], [0x451]
        ],
        notEditableClass: '',
        notUserInputClass: ''
    },
    defaultFraction: {
        scale: 2,
        pointer: '.',
        min: Number.NEGATIVE_INFINITY,
        max: Number.POSITIVE_INFINITY,
        precision: 18
    }
};

export default defaultSettings;
