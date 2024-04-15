
import { Context, Dispatch, SetStateAction, createContext } from 'react';
import { SimpleDebugEntry } from '../services/transform-debug-log';

export interface FsmRxContextActions {
  setStateDiagramDefinition?: Dispatch<SetStateAction<string | undefined>>;
  setDebugLog?: React.Dispatch<React.SetStateAction<SimpleDebugEntry[] | undefined>>;
  debugLogKeys?: string[];
}

export const FsmRxContext: Context<FsmRxContextActions> = createContext<FsmRxContextActions>({});