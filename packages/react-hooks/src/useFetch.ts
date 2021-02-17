// Copyright 2017-2021 @polkadot/apps, UseTech authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Observable } from '@polkadot/x-rxjs';

import { useCallback } from 'react';
import { fromFetch } from 'rxjs/fetch';
import { of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

export type ErrorType = {
  error: boolean;
  message: string;
}

export type UseFetchType = {
  fetchData: <T>(url: string) => Observable<T | ErrorType>;
};

export const useFetch = (): UseFetchType => {
  const fetchData = useCallback(<T>(url: string): Observable<T | ErrorType> => {
    return fromFetch(url).pipe(
      switchMap((response) => {
        if (response.ok) {
          return response.json();
        } else {
          console.log(`Error ${response.status}`);

          return of({ error: true, message: `Error ${response.status}` });
        }
      }),
      catchError((err: { message: string }) => {
        return of({ error: true, message: err.message });
      })
    );
  }, []);

  return { fetchData };
};

export default useFetch;
