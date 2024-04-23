/*eslint-disable*/
import { BaseStateData, FSMInitStateData } from "fsm-rx";
import { BehaviorSubject, Observable, Subject, catchError, debounceTime, filter, of, switchMap, take, takeUntil, timeout } from "rxjs";

type FsmRepositoryStore = {
    [key: string]: Observable<BaseStateData<string> | FSMInitStateData>;
};

class FsmRepository {
    private _fsmRepositoryStore$: BehaviorSubject<FsmRepositoryStore> = new BehaviorSubject({});

    public addFsmData<
        TState extends string,
        TStateData extends BaseStateData<TState>
    >(
        fsmName: string,
        stateData$: Observable<TStateData | FSMInitStateData>,
        destroy$: Subject<void>
    ): boolean {

        const currentStore: FsmRepositoryStore = { ...this._fsmRepositoryStore$.value };

        if (currentStore.hasOwnProperty(fsmName)) {
            console.error(`A FSM called ${fsmName} already exists in the FsmRepository and therefore cannot be added.`);
            return false;
        }

        stateData$.pipe(takeUntil(destroy$)).subscribe({
            complete: () => { this.removeFsmData(fsmName); }
        });
        currentStore[fsmName] = stateData$;
        this._fsmRepositoryStore$.next(currentStore);
        return true;
    };

    private removeFsmData(fsmName: string) {
        const currentStore: FsmRepositoryStore = { ...this._fsmRepositoryStore$.value };
        if (currentStore.hasOwnProperty(fsmName)) {
            delete currentStore[fsmName];
            this._fsmRepositoryStore$.next(currentStore);
        }
    }

    public getFsmData$(fsmName: string, destroy$: Subject<void>, timeoutDuration: number = 0): Observable<BaseStateData<string> | FSMInitStateData | undefined> {

        let stateData$: Observable<FsmRepositoryStore | undefined> = this._fsmRepositoryStore$.pipe(
            debounceTime(0),
            takeUntil(destroy$),
            filter((fsmRepositoryStore: FsmRepositoryStore) => { return fsmRepositoryStore.hasOwnProperty(fsmName); }),
            take(1),

        );
        if (timeoutDuration >= 0) {
            stateData$ = stateData$.pipe(
                timeout(timeoutDuration),
                catchError(() => {
                    return of(undefined);
                })
            );
        }

        return stateData$.pipe(
            switchMap((fsmRepositoryStore: FsmRepositoryStore | undefined) => {
                if (!fsmRepositoryStore) { return of(undefined); }
                return fsmRepositoryStore[fsmName];
            }));
    }
}

const fsmRepository = new FsmRepository();
export default fsmRepository;