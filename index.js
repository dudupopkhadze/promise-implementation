const PromiseStatus = {
  pending: "PENDING",
  fulfilled: "FULFILLED",
  rejected: "REJECTED",
};

class NextPromise {
  #status;
  #deffered = [];
  #value;

  constructor(fn) {
    if (typeof fn !== "function") {
      throw new TypeError("not a function");
    }
    this.#status = PromiseStatus.pending;
    try {
      fn(this.#resolve.bind(this), this.#reject.bind(this));
    } catch (e) {
      this.#reject.bind(this)(e);
    }
  }

  #resolve(data) {
    if (this.#status === PromiseStatus.pending) {
      this.#status = PromiseStatus.fulfilled;
      this.#value = data;
      this.#handle();
    }
  }

  #reject(err) {
    if (this.#status === PromiseStatus.pending) {
      this.#status = PromiseStatus.rejected;
      this.#value = err;
      this.#handle();
    }
  }

  #handle() {
    if (
      this.#status === PromiseStatus.rejected &&
      this.#deffered.length === 0
    ) {
      console.log("Unhandled promise rejection", this.#value);
    }

    this.#deffered.forEach((deferred) => {
      setTimeout(() => {
        const callback =
          this.#status === PromiseStatus.fulfilled
            ? deferred.onResolved
            : deferred.onRejected;
        if (callback === null) {
          if (this.#status === PromiseStatus.fulfilled) {
            this.#resolve.bind(deferred.promise)(this.#value);
          } else {
            this.#reject.bind(deferred.promise)(this.#value);
          }
          return;
        }
        let result;
        try {
          result = callback(this.#value);
        } catch (e) {
          this.#reject.bind(deferred.promise)(e);
        }
        this.#resolve.bind(deferred.promise)(result);
      }, 0);
    });
  }

  then(onResolved, onRejected) {
    const promise = new this.constructor(() => {});
    this.#deffered.push({
      onResolved: typeof onResolved === "function" ? onResolved : null,
      onRejected: typeof onRejected === "function" ? onRejected : null,
      promise,
    });
    return promise;
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }
}

const promiseTimeout = new NextPromise((resolve, reject) => {
  setTimeout(() => {
    resolve("Time is over");
    reject(new Error("Error"));
  }, 1000);
});

promiseTimeout
  .then((data) => {
    console.log(data);
  })
  .then(() => {
    throw new Error("Error!");
  })
  .catch((err) => console.log(err.message ? err.message : err));
