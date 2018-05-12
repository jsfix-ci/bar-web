import {Component, OnInit, ViewChild} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { FeeLogModel } from '../../models/feelog.model';
import { UserService } from '../../../shared/services/user/user.service';
import { PaymentslogService } from '../../services/paymentslog/paymentslog.service';
import { PaymenttypeService } from '../../services/paymenttype/paymenttype.service';
import { FeelogService } from '../../services/feelog/feelog.service';
import { UtilService } from '../../../shared/services/util/util.service';
import { PaymentstateService } from '../../../shared/services/state/paymentstate.service';
import { PaymentInstructionActionModel } from '../../models/payment-instruction-action.model';
import { FeeDetailModel } from '../../models/feedetail.model';
import { PaymentAction } from '../../models/paymentaction.model';
import { PaymentStatus } from '../../models/paymentstatus.model';
import { IResponse } from '../../interfaces/index';
import { FeeSearchModel } from '../../models/feesearch.model';
import { CaseFeeDetailModel } from '../../models/casefeedetail';
import { PaymentInstructionModel } from '../../models/paymentinstruction.model';
import { ICaseFeeDetail } from '../../interfaces/payments-log';
import { orderFeeDetails } from '../../../shared/models/util/model.utils';
import { FeeDetailEventMessage, EditTypes, UnallocatedAmountEventMessage } from './detail/feedetail.event.message';
import * as _ from 'lodash';

@Component({
  selector: 'app-feelogedit',
  templateUrl: './feelogedit.component.html',
  providers: [FeelogService, PaymentslogService, PaymenttypeService],
  styleUrls: ['./feelogedit.component.scss']
})

export class FeelogeditComponent implements OnInit {

  feeDetail: FeeDetailModel = new FeeDetailModel();
  loadedId: string;
  model: FeeLogModel = new FeeLogModel();
  paymentInstructionActionModel: PaymentInstructionActionModel = new PaymentInstructionActionModel();

  refundModalOn = false;
  returnModalOn = false;
  suspenseModalOn = false;

  mainComponentOn = true;
  feeDetailsComponentOn = false;
  delta = new UnallocatedAmountEventMessage(0, 0, 0);
  detailPageType = EditTypes.CREATE;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private paymentLogService: PaymentslogService,
    private paymentTypeService: PaymenttypeService,
    private feeLogService: FeelogService,
    private location: Location,
    private paymentState: PaymentstateService) {
      this.model.payment_type = { name: '' };
     }

  ngOnInit() {
    // observe the route changes
    this.route
      .params
      .subscribe(params => this.onRouteParams(params));
  }

  onRouteParams(params) {
    if (typeof params.id !== 'undefined') {
      this.loadedId = params.id;
      if (/[0-9]/.test(this.loadedId)) {
        this.loadPaymentInstructionById(this.loadedId);
      } else {
        this.router.navigateByUrl('/paymentslog');
      }
    }
  }

  addEditFeeToCase(message: FeeDetailEventMessage) {
    this.closeDetails();
    if (!message.isDirty) {
      return;
    }
    if (message.feeDetail.remission_amount > message.feeDetail.amount) {
      // TODO: proper error message
      return;
    }

    if (this.model.status === PaymentStatus.TRANSFERREDTOBAR && message.editType === EditTypes.UPDATE && message.isDirty) {
      return this.editTransferedFee(message.feeDetail, message.originalFeeDetail);
    }
    // check if we already have a fee_id
    let method = 'post';
    if (message.feeDetail.case_fee_id) {
      method = 'put';
    }

    message.feeDetail.payment_instruction_id = this.model.id;
    this.feeLogService.addEditFeeToCase(this.loadedId, message.feeDetail, method)
      .then(() => {
        return this.loadPaymentInstructionById(this.model.id);
      })
      .catch(error => {
        console.error(error);
      });
  }

  editTransferedFee(feeDetail: FeeDetailModel, originalFeeDetail: FeeDetailModel) {
    const negatedFeeDetail = this.negateFeeDetail(originalFeeDetail);

    // have to set the case_id to null in both post
    negatedFeeDetail.case_fee_id = null;
    this.feeDetail.case_fee_id = null;

    this.feeLogService.addEditFeeToCase(this.loadedId, negatedFeeDetail, 'post')
      .then(() => this.feeLogService.addEditFeeToCase(this.loadedId, feeDetail, 'post'))
      .then(() => {
        this.loadPaymentInstructionById(this.model.id);
      })
      .catch(err => {
        console.error(err);
      });
  }

  negateFeeDetail(feeDetail: FeeDetailModel): FeeDetailModel {
    if (!feeDetail) {
      return null;
    }
    const negate = (amount) => amount != null ? amount * -1 : amount;
    feeDetail.amount = negate(feeDetail.amount);
    feeDetail.remission_amount = negate(feeDetail.remission_amount);
    feeDetail.refund_amount = negate(feeDetail.refund_amount);
    feeDetail.case_fee_id = null;
    return feeDetail;
  }

  loadPaymentInstructionById(feeId) {
    const p1 = this.paymentLogService.getPaymentById(feeId);
    const p2 = this.paymentLogService.getUnallocatedAmount(feeId);
    Promise.all([p1, p2])
      .then(responses => {
        if (responses[0].success && responses[1].success) {
          this.model.assign(responses[0].data);
          this.model.unallocated_amount = responses[1].data;
          // this.model.case_fee_details = orderFeeDetails(this.model.case_fee_details);
        } else {
          const errorMessage = responses
            .filter(resp => !resp.success)
            .map(resp => resp.data)
            .join(',');
          throw new Error(errorMessage);
        }
      })
      .catch(err => {
        console.error(err);
      });
  }

  goBack() { this.location.back(); }

  async onProcessPaymentSubmission(model: FeeLogModel) {
    this.paymentInstructionActionModel.action = PaymentAction.PROCESS;

    const [err, data] = await UtilService
      .toAsync(this.feeLogService.sendPaymentInstructionAction(model, this.paymentInstructionActionModel));

    if (!err && data.success === true) {
      this.paymentInstructionActionModel = new PaymentInstructionActionModel();
      return this.router.navigateByUrl('/feelog');
    }
  }

  async onSuspenseFormSubmit(e: Event) {
    e.preventDefault();

    if (this.paymentInstructionActionModel.hasOwnProperty('reason')) {
      const [err, data] = await UtilService
        .toAsync(this.feeLogService.sendPaymentInstructionAction(this.model, this.paymentInstructionActionModel));

      if (!err && data.success === true) {
        this.paymentInstructionActionModel = new PaymentInstructionActionModel();
        this.suspenseModalOn = !this.suspenseModalOn;
        this.router.navigateByUrl('/feelog');
      }
    }
  }

  returnPaymentToPostClerk() {
    this.model.status = PaymentStatus.VALIDATED;
    this.model.action = PaymentAction.RETURNS;

    this.feeLogService.updatePaymentModel(this.model).then(res => {
      this.toggleReturnModal();
      return this.router.navigateByUrl('/feelog');
    });
  }

  getUnallocatedAmount(): number {
    return this.model.unallocated_amount - this.delta.amountDelta * 100 + this.delta.remissionDelta * 100 - this.delta.refundDelta * 100;
  }

  toggleRefundModal() { this.refundModalOn = !this.refundModalOn; }
  toggleReturnModal() { this.returnModalOn = !this.returnModalOn; }
  toggleSuspenseModal() { this.suspenseModalOn = !this.suspenseModalOn; }

  changeStatusToRefund() {
    this.model.action = PaymentAction.REFUNDED;
    this.model.status = PaymentStatus.VALIDATED;
    this.feeLogService.updatePaymentModel(this.model).then(res => {
      this.toggleReturnModal();
      return this.router.navigateByUrl('/feelog');
    });
  }

  isRefundEnabled(): boolean {
    return this.model.status === PaymentStatus.TRANSFERREDTOBAR;
  }

  makeDetailsVisible(feeDetailEventMessage: FeeDetailEventMessage) {
    this.feeDetail = _.cloneDeep(feeDetailEventMessage.feeDetail);
    this.detailPageType = feeDetailEventMessage.editType;
    this.mainComponentOn = false;
    this.feeDetailsComponentOn = true;

  }

  closeDetails() {
    this.mainComponentOn = true;
    this.feeDetailsComponentOn = false;
  }

  updateUnallocatedAmount(delta: UnallocatedAmountEventMessage) {
    this.delta = delta;
  }

  collectCaseReferences(): Array<String> {
    // return this.model.case_fee_details ? _.uniq(this.model.case_fee_details.map(it => it.case_reference)) : [];
    return [];
  }

  onSuspensePayment() {
    this.suspenseModalOn = true;
  }

  onReturnPayment() {
    this.returnModalOn = true;
  }
}
