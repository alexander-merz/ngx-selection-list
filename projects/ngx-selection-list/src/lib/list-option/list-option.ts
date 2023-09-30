import { EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';

export interface ListOption<T> extends Option<T> {
  selectionTimeout: number | undefined;

  readonly state$: Observable<OptionState<T>>;

  select(): void;
  deselect(): void;
}

export interface Option<T> extends OptionState<T> {
  disabled: boolean;
  readonly selectedChange: EventEmitter<boolean>;
}

export interface OptionState<T> {
  selected: boolean;
  value: T | undefined;
}

