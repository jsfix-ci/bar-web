import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { PaymentInstructionActionModel } from '../../models/payment-instruction-action.model';
import { FeeDetailModel } from '../../models/feedetail.model';
import {ICaseFeeDetail} from '../../interfaces/payments-log';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import { PaymentInstructionModel } from '../../models/paymentinstruction.model';

@Injectable()
export class FeelogService {
  private feelogResponse: any = false;

  constructor(private http: HttpClient) { }

  getFeeLog (status): Promise<any> {
    return this.http
      .get(`${environment.apiUrl}/payments-instructions?status=${status}`)
      .toPromise();
  }

  getFeeCodesAndDescriptions(code: string) {
    let url = `${environment.apiUrl}/fees/search`;
    if (code !== '') {
      url += `?code=${code}`;
    }

    return this.http
      .get(url)
      .toPromise();
  }

  addEditFeeToCase(paymentInstructionId: string, data: ICaseFeeDetail, method = 'post') {

    return this.http[method](`${environment.apiUrl}/payment-instructions/${paymentInstructionId}/fees`, data)
      .toPromise();
  }

  sendPaymentInstructionAction(paymentInstruction: PaymentInstructionModel, paymentInstructionActionModel: PaymentInstructionActionModel) {
    return this.http
      .put(`${environment.apiUrl}/payment-instructions/${paymentInstruction.id}`, paymentInstructionActionModel)
      .toPromise();
  }

  updatePaymentModel(paymentInstruction: PaymentInstructionModel) {
    return this.http
      .put(`${environment.apiUrl}/payment-instructions/${paymentInstruction.id}`, paymentInstruction)
      .toPromise();
  }

  getUnallocatedAmount(model: PaymentInstructionModel, feeDetail: FeeDetailModel): number {
    const [feeAmount, remissionAmount, refundAmount] = this.collectFeeAmounts(feeDetail);
    const amount: number = model.getProperty('unallocated_amount');
    return amount - feeAmount + remissionAmount - refundAmount;
  }

  collectFeeAmounts(feeDetail: ICaseFeeDetail): Array<number> {
    const feeAmount: number = feeDetail.amount ? feeDetail.amount : 0;
    const remissionAmount: number = feeDetail.remission_amount ? parseFloat(feeDetail.remission_amount.toString()) : 0;
    const refundAmount: number = feeDetail.refund_amount ? parseFloat(feeDetail.refund_amount.toString()) : 0;
    return [feeAmount, remissionAmount, refundAmount];
  }

  removeFeeFromPaymentInstruction(caseFee: ICaseFeeDetail) {
    return this.http
      .delete(`${environment.apiUrl}/fees/${caseFee.case_fee_id}`)
      .toPromise();
  }

}
