import { expect } from 'chai'
import * as request from 'supertest'
import * as mock from 'nock'
import { app } from '../../../../main/app'
import * as paymentTypeMock from '../../../http-mocks/paymenttypes'
import '../../../routes/expectations'

// const cookieName: string = config.get<string>('session.cookieName')

describe('Bar Web - Payment & Services', () => {
  beforeEach(() => {
    mock.cleanAll()
  })

  describe('Get list of payments: ', () => {
    it('Should retrieve all the payment types and check for field "Payment by Account".', async () => {
      paymentTypeMock.getPaymentTypes()

      await request(app)
        .get('/posts/record')
        .end((res) => {
          expect(res).to.be.successful.withText('Payment by Account')
        })
    })
  })
})
