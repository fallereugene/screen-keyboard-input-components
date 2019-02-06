import * as models from './models';
import * as consts from './constants';

export interface IMapStateToProps {}
export interface IMapDispatchToProps {}

export type RootProps = IMapStateToProps & IMapDispatchToProps;

export interface IAction {
    type: consts.ROOT_INCREMENT_VALUE;
}

export type KnownAction = IAction;
