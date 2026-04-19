import {type Failure} from './Failure';
import {type Success} from './Success';

export type Result<T, E = Error> = Success<T> | Failure<E>;
