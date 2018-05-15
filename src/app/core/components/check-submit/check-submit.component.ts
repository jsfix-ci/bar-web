import {Component, OnInit} from '@angular/core';
import {CheckAndSubmit} from '../../models/check-and-submit';
import {PaymentslogService} from '../../services/paymentslog/paymentslog.service';
import {SearchModel} from '../../models/search.model';
import {PaymentStatus} from '../../models/paymentstatus.model';
import {IResponse} from '../../interfaces';
import {PaymentInstructionsService} from '../../services/payment-instructions/payment-instructions.service';
import {UserService} from '../../../shared/services/user/user.service';
import { PaymentInstructionModel } from '../../models/paymentinstruction.model';
import {Observable} from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { switchMap } from 'rxjs/operator/switchMap';
import { map, take } from 'rxjs/operators';
import { forkJoin } from 'rxjs/observable/forkJoin';

@Component({
  selector: 'app-check-submit',
  templateUrl: './check-submit.component.html',
  styleUrls: ['./check-submit.component.scss'],
  providers: [PaymentslogService, PaymentInstructionsService]
})
export class CheckSubmitComponent implements OnInit {
  checkAndSubmitModels$: BehaviorSubject<CheckAndSubmit[]> = new BehaviorSubject<CheckAndSubmit[]>([]);
  numberOfItems: number;
  toggleAll = false;

  constructor(
    private _paymentsLogService: PaymentslogService,
    private _paymentsInstructionService: PaymentInstructionsService,
    private _userService: UserService) {
  }

  ngOnInit() {
    this.getPaymentInstructions();
  }

  getPaymentInstructions() {
    const searchModel: SearchModel = new SearchModel();
    searchModel.id = this._userService.getUser().id.toString();
    searchModel.status = PaymentStatus.VALIDATED;

    return this._paymentsLogService
      .getPaymentsLogByUser(searchModel)
      .pipe(take(1), map((response: IResponse) => this._paymentsInstructionService.transformIntoCheckAndSubmitModels(response.data)))
      .subscribe(data => {
        console.log( data );
        this.numberOfItems = data.filter(model => model.paymentId !== null).length;
        this.checkAndSubmitModels$.next(data);
      });
  }

  // events based on clicks etc will go here
  onSelectAll() {
    this.toggleAll = !this.toggleAll;
    this.checkAndSubmitModels$.subscribe(data$ => data$.forEach(model => model.checked = this.toggleAll));
  }

  onSubmission() {
    const savePaymentInstructionRequests = [];
    const checkAndSubmitModels = this.checkAndSubmitModels$.getValue().filter(model => model.paymentId && model.checked);

    checkAndSubmitModels.forEach(model => {
      const paymentInstructionModel = new PaymentInstructionModel();
      paymentInstructionModel.assign(model);
      paymentInstructionModel.status = PaymentStatus.PENDINGAPPROVAL;
      savePaymentInstructionRequests.push(this._paymentsInstructionService.savePaymentInstruction(paymentInstructionModel));
    });

    forkJoin(savePaymentInstructionRequests).subscribe(results => console.log(results));
    // console.log( checkAndSubmitModels );
  }

  onToggleChecked(checkAndSubmitModel) {
    checkAndSubmitModel.checked = !checkAndSubmitModel.checked;
  }
}
