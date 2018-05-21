import { CurrencyConverterInterceptor } from './currency.converter.interceptor';
import { HttpRequest, HttpHandler, HttpResponse } from '@angular/common/http';
import { instance, mock } from 'ts-mockito/lib/ts-mockito';
import { RSA_X931_PADDING } from 'constants';
import { Observable } from 'rxjs/Observable';

describe('PoundToPenceConverter', () => {
  let currencyConverterInterceptor: CurrencyConverterInterceptor;
  let next: HttpHandler;

  beforeEach(() => {
    currencyConverterInterceptor = new CurrencyConverterInterceptor();
    next = instance(mock(HttpHandler));
  });

  function createRequest(body) {
    return new HttpRequest('POST', 'http://some.url', body);
  }

  it('outgoing request containing amount should be converted to pence', () => {
    const request = createRequest({ amount: 100 });
    let modifiedRequest: HttpRequest<any>;
    spyOn(next, 'handle').and.callFake(req => {
      modifiedRequest = req;
      return [];
    });
    currencyConverterInterceptor.intercept(request, next);
    expect(modifiedRequest.body).toEqual({ amount: 10000 });
  });

  it('outgoing request containing amount should be converted to pence', () => {
    const request = createRequest({ something_else: 100 });
    let modifiedRequest: HttpRequest<any>;
    spyOn(next, 'handle').and.callFake(req => {
      modifiedRequest = req;
      return [];
    });
    currencyConverterInterceptor.intercept(request, next);
    expect(modifiedRequest.body).toEqual({ something_else: 100 });
  });

  it('incoming response should be converted back to pounds', done => {
    const request = createRequest({ something_else: 100 });
    spyOn(next, 'handle').and.callFake(req => {
      const httpResponse = new HttpResponse<any>({
        body: { resp_amount: 100 },
        url: 'http://some.url'
      });
      return new Observable(observer => {
        observer.next(httpResponse);
        observer.complete();
      });
    });
    const resp = currencyConverterInterceptor.intercept(request, next);
    resp.subscribe(x => {
      const response = x as HttpResponse<any>;
      expect(response.body).toEqual({ resp_amount: 1 });
      done();
    });
  });
});
