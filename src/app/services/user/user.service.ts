import { Injectable } from '@angular/core';
import {} from 'rxjs/BehaviorSubject';
import { UserModel } from '../../models/user.model';

@Injectable()
export class UserService {

  private user: any = false;

  constructor() { }

  getUser() {
    if (localStorage.getItem('user') === null) {
      return false;
    }
    return JSON.parse(localStorage.getItem('user'));
  }

  authenticate(userModel: UserModel): boolean {
    if (userModel.email === 'post.clerk@hmcts.net' && userModel.password === 'password') {
      this.storeUser(userModel);
      return true;
    } else if (userModel.email === 'fee.clerk@hmcts.net' && userModel.password === 'password') {
      this.storeUser(userModel);
      return true;
    } else if (userModel.email === 'seniorfee.clerk@hmcts.net' && userModel.password === 'password') {
      this.storeUser(userModel);
      return true;
    }
    return false;
  }

  clearUser(): void {
    this.user.email = '';
  }

  storeUser(user: any) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  logOut() {
    this.user = false;
    localStorage.removeItem('user');
  }

}
