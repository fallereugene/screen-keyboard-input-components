import InputString, { IInputString } from '../models/InputString';
import MaskedInput, { IMaskedInput } from '../models/MaskedInput';
import FractionInput, { IFractionInput } from '../models/FractionInput';
import defaultSettings, { IDefaults } from './defaultSettings';
import { IOptions } from '../Input';

export type InputOptions<TOptions> = IDefaults & IOptions & TOptions;
export type ViewModel = IInputString | IMaskedInput | IFractionInput;

const detectModel = (options) => {
    let viewModel: ViewModel;
    let baseOptions: IDefaults & IOptions = { ...defaultSettings.defaults, ...options };

    switch (baseOptions.mode) {
        case 'string':
            viewModel = new InputString<IInputString>({ ...defaultSettings.defaultsString, ...baseOptions });
            break;
        case 'mask':
            viewModel = new MaskedInput<IMaskedInput>({ ...defaultSettings.defaultsMask, ...baseOptions });
            break;
        case 'fraction':
            viewModel = new FractionInput<IFractionInput>({ ...defaultSettings.defaultFraction, ...baseOptions });
            break;
        default:
            throw new Error(`Unkown input mode '${options.mode}'`);
    }
    return viewModel;
};

export default detectModel;
