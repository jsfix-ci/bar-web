import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NavigationModel } from './navigation.model';
import { PaymentslogService } from '../../../core/services/paymentslog/paymentslog.service';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { SearchService } from '../../../core/services/search/search.service';
import { PaymentstateService } from '../../../shared/services/state/paymentstate.service';
import { PaymenttypeService } from '../../../core/services/paymenttype/paymenttype.service';
import { SearchModel } from '../../../core/models/search.model';
import { UtilService } from '../../../shared/services/util/util.service';
import { NavigationTrackerService } from '../../../shared/services/navigationtracker/navigation-tracker.service';
import { UserService } from '../../../shared/services/user/user.service';
import { IResponse } from '../../../core/interfaces';
import { PaymentStatus } from '../../../core/models/paymentstatus.model';
import { PaymentInstructionsService } from '../../../core/services/payment-instructions/payment-instructions.service';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  providers: [PaymentInstructionsService, PaymentslogService, PaymenttypeService],
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit {
  model: NavigationModel = new NavigationModel();
  searchModel: SearchModel = new SearchModel();
  todaysDate = Date.now();
  name = '';
  advancedSearchedOpen = false;
  allStatuses = ['P', 'PA', 'A', 'V', 'TTB', 'REJ'];

  constructor(
    private userService: UserService,
    private navigationTrackerService: NavigationTrackerService,
    private _paymentInstructionService: PaymentInstructionsService,
    private paymentslogService: PaymentslogService,
    private paymentState: PaymentstateService,
    private paymentTypeService: PaymenttypeService,
    private router: Router,
    private route: ActivatedRoute,
    private searchService: SearchService) {}

  ngOnInit() {
    this.searchModel.action = '';
    this.searchModel.paymentType = '';
    this.searchModel.status = PaymentStatus.PENDING;
    this.paymentTypeService.getPaymentTypes().then((data: IResponse) => this.paymentState.setSharedPaymentTypes(data.data));
  }

  get navigationClass() {
    return this.navigationTrackerService.barColor;
  }

  get isSearchVisible() {
    if (!this.navigationTrackerService.isSearchVisible) {
      this.advancedSearchedOpen = false;
    }
    return this.navigationTrackerService.isSearchVisible;
  }

  get user() {
    return this.userService.getUser();
  }

  get paymentTypes() {
    return this.paymentState.state.paymentTypes;
  }

  get searchResults() {
    return this.searchService.paymentLogs;
  }

  onSubmit($ev) {
    $ev.preventDefault();

    if ($ev.which && $ev.which === 13) {
      this.performQuerySearch();
    }
  }

  onClick() {
    this.performQuerySearch();
  }

  performQuerySearch() {
    this.paymentslogService
      .searchPaymentsByDate(this.searchModel)
      .then((result: IResponse) => {
        this.searchService
          .createPaymentInstructions(this._paymentInstructionService.transformJsonIntoPaymentInstructionModels(result.data));
        this.searchModel.query = '';
        return this.router.navigateByUrl('/search');
      })
      .catch(err => console.log(err));
  }

  logout() {
    this.userService.logOut();
    document.location.href = '/logout';
  }

  toggleAdvancedSearch() {
    this.advancedSearchedOpen = !this.advancedSearchedOpen;
  }

  performQueryByDate(e) {
    e.preventDefault();
    this.performQuerySearch();
  }

}
