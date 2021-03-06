import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
} from "@angular/core";

import { BehaviorSubject } from "rxjs";
import { distinctUntilChanged } from "rxjs/operators";

@Component({
  selector: "app-tab",
  templateUrl: "./tab.component.html",
  styleUrls: ["./tab.component.scss"],
})
export class TabComponent implements OnDestroy {
  @Input() tabTitle: string;

  @Output() select = new EventEmitter<void>();

  private _isVisible$ = new BehaviorSubject<boolean>(false);
  isVisible$ = this._isVisible$.asObservable().pipe(distinctUntilChanged());

  ngOnDestroy() {
    this.hide();
  }

  hide() {
    this._isVisible$.next(false);
  }

  show() {
    this._isVisible$.next(true);
    this.select.next();
  }

  get isVisible() {
    return this._isVisible$.value;
  }
}
