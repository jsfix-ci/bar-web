import {Injectable} from '@angular/core';
import {PaymentInstructionModel} from '../../models/paymentinstruction.model';
import {CheckAndSubmit} from '../../models/check-and-submit';
import {ICaseFeeDetail, IPaymentsLog} from '../../interfaces/payments-log';
import {FeeDetailModel} from '../../models/feedetail.model';
import {environment} from '../../../../environments/environment';
import {PaymentStatus} from '../../models/paymentstatus.model';
import {BarHttpClient} from '../../../shared/services/httpclient/bar.http.client';
import {isUndefined} from 'lodash';
import {PaymentStateService} from '../../../shared/services/state/paymentstate.service';
import {SearchModel} from '../../models/search.model';
import {Observable} from 'rxjs';
import * as moment from 'moment';
import { PaymentTypeEnum } from '../../models/payment.type.enum';

@Injectable()
export class PaymentInstructionsService {
  constructor(private _http: BarHttpClient,
              private _PaymentStateService: PaymentStateService) {}
  paymentTypeEnum = new PaymentTypeEnum();

  getPaymentInstructions(status?: PaymentStatus[]): Observable<any> {
    const params = isUndefined(typeof status) ? '' : `?status=${status.join(',')}`;
    return this._http.get(`/api/payment-instructions${params}`);
  }

  savePaymentInstruction(paymentInstructionModel: PaymentInstructionModel): Observable<any> {
    return this._http.post(`/api/payment/` +
      this._PaymentStateService.paymentTypeEnum.getValue().getEndpointUri(paymentInstructionModel.payment_type.id),
        paymentInstructionModel);
  }

  getPaymentInstructionById(id: number): Observable<any> {
    return this._http.get(`/api/payment-instructions/${id}`);
  }

  getCount(searchModel: SearchModel) {
    return this._http
      .get(`${environment.apiUrl}/payment-instructions/count?userId=${searchModel.userId}&status=${searchModel.status}`
      + `&startDate=${ moment(searchModel.startDate).format('DDMMYYYY') }&endDate=${ moment(searchModel.startDate).format('DDMMYYYY')}`);
  }

  transformIntoCheckAndSubmitModels(paymentInstructions: IPaymentsLog[]): CheckAndSubmit[] {
    const models = [];

    paymentInstructions.forEach((paymentInstruction: PaymentInstructionModel) => {
      if (paymentInstruction.case_fee_details.length < 1) {
        const checkAndSubmitModel = new CheckAndSubmit();
        checkAndSubmitModel.convertTo(paymentInstruction);
        models.push(checkAndSubmitModel);
        return;
      }

      paymentInstruction.case_fee_details.forEach((fee: ICaseFeeDetail) => {
        const checkAndSubmitModel = new CheckAndSubmit();
        const feeModel = new FeeDetailModel();
        feeModel.assign(fee);
        checkAndSubmitModel.convertTo(paymentInstruction, feeModel);

        if (feeModel.remission_amount !== null || feeModel.refund_amount !== null) {
          // console.log(feeModel);
        }

        if (models.find(model => model.paymentId === feeModel.payment_instruction_id)) {
          checkAndSubmitModel.removeDuplicateProperties();
        }
        models.push(checkAndSubmitModel);
      });
    });
    return models;
  }

  // TODO: Revisit this, as the amount is not correct (become formatted string in payment instruction)
  transformIntoPaymentInstructionModel(checkAndSubmitModel: CheckAndSubmit): PaymentInstructionModel {
    const paymentInstructionModel: PaymentInstructionModel = new PaymentInstructionModel();
    paymentInstructionModel.id = checkAndSubmitModel.paymentId;
    paymentInstructionModel.payer_name = checkAndSubmitModel.name;
    paymentInstructionModel.amount = checkAndSubmitModel.paymentAmount;
    paymentInstructionModel.currency = 'GBP';
    paymentInstructionModel.payment_type = checkAndSubmitModel.paymentType;
    paymentInstructionModel.status = checkAndSubmitModel.status;
    paymentInstructionModel.action = checkAndSubmitModel.action;
    paymentInstructionModel.payment_reference = paymentInstructionModel.getPaymentReference(this.paymentTypeEnum);

    if (!isUndefined(checkAndSubmitModel.bgcNumber)) {
      paymentInstructionModel.bgc_number = checkAndSubmitModel.bgcNumber;
    }

    const paymentTypeEnum = this._PaymentStateService.paymentTypeEnum;
    switch (paymentInstructionModel.payment_type.id) {
      case paymentTypeEnum.getValue().CHEQUE:
        paymentInstructionModel.cheque_number = checkAndSubmitModel.chequeNumber;
        break;
      case paymentTypeEnum.getValue().POSTAL_ORDER:
        paymentInstructionModel.postal_order_number = checkAndSubmitModel.postalOrderNumber;
        break;
      case paymentTypeEnum.getValue().ALLPAY:
        paymentInstructionModel.all_pay_transaction_id = checkAndSubmitModel.allPayTransactionId;
        break;
      case paymentTypeEnum.getValue().CARD:
        paymentInstructionModel.authorization_code = checkAndSubmitModel.authorizationCode;
        break;
    }
    return paymentInstructionModel;
  }

  transformJsonIntoPaymentInstructionModels(data): PaymentInstructionModel[] {
    const models: PaymentInstructionModel[] = [];
    if (data) {
      data.forEach((payment: IPaymentsLog) => {
        const paymentInstruction = new PaymentInstructionModel();
        paymentInstruction.assign(payment);
        paymentInstruction.payment_reference = paymentInstruction.getPaymentReference(this.paymentTypeEnum);
        paymentInstruction.selected = false;
        models.push(paymentInstruction);
      });
    }
    return models;
  }
}
