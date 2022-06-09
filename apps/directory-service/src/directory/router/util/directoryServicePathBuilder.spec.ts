import { DirectoryServicePathBuilder } from './directoryServicePathBuilder';

describe('PathBuilder', () => {
  it('can make valid entries path', () => {
    const builder = new DirectoryServicePathBuilder();
    const path = builder.namespace('fred').entries().build();

    expect(path).toEqual('/namespaces/fred/entries');
  });

  it('can make valid entries path, with empty namespace', () => {
    const builder = new DirectoryServicePathBuilder();
    const path = builder.namespace(null).entries('fred').build();

    expect(path).toEqual('/namespaces/fred/entries');
  });

  it('uses root', () => {
    const builder = new DirectoryServicePathBuilder('root-beer');
    const path = builder.namespace('fred').entries().build();

    expect(path).toEqual('/root-beer/namespaces/fred/entries');
  });

  it('can use overloading', () => {
    const builder = new DirectoryServicePathBuilder('billy-bong');
    const path = builder.service('rick', 'fred').build();

    expect(path).toEqual('/billy-bong/namespaces/fred/services/rick');
  });

  it('can make valid services path', () => {
    const builder = new DirectoryServicePathBuilder();
    const path = builder.namespace('bob').services().build();

    expect(path).toEqual('/namespaces/bob/services');
  });

  it('truncates at undefined', () => {
    const builder = new DirectoryServicePathBuilder();
    const path = builder.namespace('bob').services().apis().api('toot').build();

    expect(path).toEqual('/namespaces/bob/services');
  });

  it('truncates at undefined with service', () => {
    const builder = new DirectoryServicePathBuilder();
    const path = builder.namespace('bob').services().apis('fred').api('toot').build();

    expect(path).toEqual('/namespaces/bob/services/fred/apis');

  });

  it('truncates at undefined with service and api', () => {
    const builder = new DirectoryServicePathBuilder();
   
    const path = builder.namespace('bob').api('toot','john').build();

    expect(path).toEqual('/namespaces/bob/services/john/apis');
  });

  it('wont allow services with entries', () => {
    const builder = new DirectoryServicePathBuilder();

    expect(() => {
      builder.namespace('bob').entries().service('toot').build();
    }).toThrowError(Error);
  });

  it('wont allow entries with services', () => {
    const builder = new DirectoryServicePathBuilder();

    expect(() => {
      builder.namespace('bob').service('toot').entries().build();
    }).toThrowError(Error);
  });
});
