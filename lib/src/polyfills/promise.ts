/*
 * @nevware21/ts-async
 * https://github.com/nevware21/ts-async
 *
 * Copyright (c) 2022 Nevware21
 * Licensed under the MIT license.
 */

import { getKnownSymbol, objDefineProp, WellKnownSymbols } from "@nevware21/ts-utils";
import { createAsyncAllPromise, createAsyncPromise, createAsyncRejectedPromise, createAsyncResolvedPromise } from "../promise/asyncPromise";
import { IPromise } from "../interfaces/IPromise";
import { PromiseExecutor } from "../interfaces/types";

const toStringTagSymbol: symbol = getKnownSymbol(WellKnownSymbols.toStringTag) as typeof Symbol.toStringTag;

export interface PolyPromiseConstructor {
    /**
     * Creates a new Promise.
     * @param executor A callback used to initialize the promise. This callback is passed two arguments:
     * a resolve callback used to resolve the promise with a value or the result of another promise,
     * and a reject callback used to reject the promise with a provided reason or error.
     */
    new <T>(executor: PromiseExecutor<T>): IPromise<T>;

    /**
     * Creates a Promise that is resolved with an array of results when all of the provided Promises
     * resolve, or rejected when any Promise is rejected.
     * @param values An array of Promises.
     * @returns A new Promise.
     */
    all<T extends readonly unknown[] | []>(values: T): Promise<{ -readonly [P in keyof T]: Awaited<T[P]> }>;

    // see: lib.es2015.iterable.d.ts
    // all<T>(values: Iterable<T | PromiseLike<T>>): Promise<T[]>;
 
    // Not yet implemented
    //  /**
    //   * Creates a Promise that is resolved or rejected when any of the provided Promises are resolved
    //   * or rejected.
    //   * @param values An array of Promises.
    //   * @returns A new Promise.
    //   */
    // race<T extends readonly unknown[] | []>(values: T): Promise<Awaited<T[number]>>;
 
    // see: lib.es2015.iterable.d.ts
    // race<T>(values: Iterable<T>): Promise<T extends PromiseLike<infer U> ? U : T>;
 
    /**
     * Creates a new rejected promise for the provided reason.
     * @param reason The reason the promise was rejected.
     * @returns A new rejected Promise.
     */
    reject<T = never>(reason?: any): Promise<T>;
 
    /**
     * Creates a new resolved promise.
     * @returns A resolved promise.
     */
    resolve(): Promise<void>;
 
    /**
     * Creates a new resolved promise for the provided value.
     * @param value A promise.
     * @returns A promise whose internal state matches the provided promise.
     */
    resolve<T>(value: T | PromiseLike<T>): Promise<T>;
}

export let PolyPromise = (function () {
    function PolyPromiseImpl<T>(executor: PromiseExecutor<T>) {
        this._$ = createAsyncPromise(executor);
        if (toStringTagSymbol) {
            this[toStringTagSymbol] = "Promise";
        }
        // Re-Expose the state of the underlying promise
        objDefineProp(this, "state", {
            get: function() {
                return this._$.state;
            }
        });
    }
    PolyPromiseImpl.all = createAsyncAllPromise;
    //PolyPromiseImpl.race = createAsyncRacePromise;
    PolyPromiseImpl.reject = createAsyncRejectedPromise;
    PolyPromiseImpl.resolve = createAsyncResolvedPromise;
    let theProto = PolyPromiseImpl.prototype;
    theProto.then = function (onResolved: any, onRejected: any) {
        return this._$.then(onResolved, onRejected);
    };
    theProto.catch = function (onRejected: any) {
        return this._$.catch(onRejected);
    };
    theProto.finally = function (onfinally: any) {
        return this._$.finally(onfinally);
    };
    return PolyPromiseImpl as unknown as PolyPromiseConstructor;
}());