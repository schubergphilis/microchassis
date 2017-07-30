import { expect } from 'chai';
import { deepSet } from './../src/utils';

describe('Utils', () => {
  it('Deepset - should set the property correctly', () => {
    const test = {
      levelOne: 'foo',
      foo: {
        bar: 'foobar'
      },
      lorem: {
        ip: {
          sum: 'lorem ipsum'
        }
      }
    }

    deepSet(test, 'levelOne', 'not foo');
    deepSet(test, 'foo.bar', 'not foobar');
    deepSet(test, 'lorem.ip.sum', 'not lorem ipsum');

    expect(test.levelOne).to.equal('not foo');
    expect(test.foo.bar).to.equal('not foobar');
    expect(test.lorem.ip.sum).to.equal('not lorem ipsum');
  });
});