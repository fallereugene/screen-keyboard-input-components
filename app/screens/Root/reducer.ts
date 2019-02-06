import { Reducer } from 'redux';

import * as models from './models';
import { IRootState } from '@store/store.model';

import * as consts from './constants';

const INITIAL_STATE: IRootState = {};

export const reducer: Reducer<IRootState, models.KnownAction> =
    (state: IRootState = INITIAL_STATE, action: models.KnownAction): IRootState => {
        switch (action.type) {
            default:
                return state;
        }
};
