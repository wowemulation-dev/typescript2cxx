class TestClass {
  private tsPrivate: number;
  #jsPrivate: number;

  constructor(value: number) {
    this.tsPrivate = value;
    this.#jsPrivate = value * 2;
  }

  unknown(): number {
    return this.#jsPrivate;
  }

  getValues() {
    return {
      ts: this.tsPrivate,
      js: this.#jsPrivate,
      method: this.#jsPrivateMethod(),
    };
  }

  #jsPrivateMethod(): number {
    return this.#jsPrivate + 1;
  }
}

const obj = new TestClass(5);

function _Main(): void {
  console.log(obj.getValues());
}
