import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { SelectionChange, SelectionModel } from '@angular/cdk/collections';
import {
  AfterContentInit,
  ChangeDetectorRef,
  ContentChildren,
  Directive,
  EventEmitter,
  forwardRef,
  HostBinding,
  Input,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { filter, merge, startWith, Subject, switchMap, takeUntil, tap } from 'rxjs';

import { ListOption, OptionState } from '../list-option/list-option';
import { ListOptionDirective, ListOptionType } from '../list-option/list-option.directive';
import { isNil, isNonNil } from '../utils/nil';
import { tapOnce } from '../utils/tap-once';

export type SelectionListType = 'listbox' | 'grid';

/**
 * Behaves like a regular {@link HTMLSelectElement} thus is
 * {@link https://www.w3.org/TR/2011/WD-html5-20110405/the-button-element.html#the-select-element a control for selecting amongst a set of options}.
 *
 * Reacts to selection changes of content projected {@link ListOption ListOptions} to determine its {@link value}.
 *
 * Supports {@link multiple} selection. Defaults to single selection.
 *
 * It does not have a pre-defined appearance unless a {@link type} is provided.
 *
 * Both, {@link ListOptionComponent} and {@link ListOptionDirective}, are supported as children (see example).
 *
 * Uses a {@link SelectionModel} from the Angular CDK internally.
 *
 * @implements {ControlValueAccessor}
 * @example
 * <div ngxSelectionList multiple type="list">
 *   <span ngxListOption [value]="1">Option 1</span>
 *   <span ngxListOption [value]="2">Option 2</span>
 * </div>
 * @author Alexander Merz
 */
@Directive({
  standalone: true,
  selector: '[ngxSelectionList]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectionListDirective),
      multi: true,
    },
  ],
})
export class SelectionListDirective<T = unknown> implements ControlValueAccessor, OnInit, AfterContentInit, OnDestroy {
  /** Allow selection of multiple options. */
  @Input({ transform: coerceBooleanProperty })
  @HostBinding('attr.multiple')
  multiple: boolean = false;

  @HostBinding('attr.aria-multiselectable')
  protected get ariaMultiselectable(): boolean {
    return Boolean(this.multiple);
  }

  /** The {@link type} dictates the appearance of the options. */
  @Input()
  @HostBinding('attr.role')
  @HostBinding('attr.type')
  type: SelectionListType = 'listbox';

  @Output() readonly selected: EventEmitter<T> = new EventEmitter();
  @Output() readonly deselected: EventEmitter<T> = new EventEmitter();

  @ContentChildren(ListOptionDirective, { descendants: true })
  private readonly _listOptionDirectives: QueryList<ListOptionDirective<T>> = new QueryList();

  /** A list of selected option values if {@link multiple} selection, a single option value otherwise. */
  @HostBinding('attr.value')
  get value(): T | T[] | undefined {
    if (this.isSingleSelection()) {
      return this._model.selected[0];
    }

    if (this._model.hasValue()) {
      const value = this._model.selected.filter(isNonNil);

      if (value.length) {
        return value;
      }
    }

    return undefined;
  }

  /** A list of all {@link Option Options} */
  get options(): ListOptionDirective<T>[] {
    return this._listOptionDirectives.toArray();
  }

  private _model: SelectionModel<T>;

  private _isContentReady: boolean = false;

  private readonly _destroy$: Subject<void> = new Subject();

  constructor(private readonly _changeDetectorRef: ChangeDetectorRef) {
    this._model = new SelectionModel<T>(false, []);
  }

  ngOnInit(): void {
    this._model = new SelectionModel<T>(this.multiple, []);

    this._model.changed.pipe(takeUntil(this._destroy$)).subscribe(({ added, removed }: SelectionChange<T>): void => {
      added.length && this.selected.emit(added[0]);
      removed.length && this.deselected.emit(removed[0]);
      this._onChange(this.value);
    });
  }

  ngAfterContentInit(): void {
    this._isContentReady = true;

    merge(this._listOptionDirectives.changes)
      .pipe(
        startWith(this.options),
        filter((options: ListOption<T>[]) => options.length > 0),
        tapOnce((options: ListOption<T>[]) => this._preselect(options)),
        tap((options: ListOption<T>[]) => {
          this._alignOptionTypes();
          this._syncWithSelectionModel(options);
          queueMicrotask(() => this._changeDetectorRef.markForCheck());
        }),
        switchMap((options: ListOption<T>[]) => merge(...options.map((option: ListOption<T>) => option.state$))),
        tap(({ selected, value }: OptionState<T>) => {
          if (isNil(value)) {
            return;
          }

          if (this.isSingleSelection() && selected && !this.isSelected(value)) {
            this._resetOptions();
          }

          selected ? this._model.select(value) : this._model.deselect(value);
        }),
        takeUntil(this._destroy$),
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  /**
   * Deselects the option the value is associated with.
   * Does not remove the value from the internal {@link SelectionModel} unless an option with this value is present.
   *
   * @param value the option value
   */
  deselect(value: T): void {
    this._getOptionByValue(value)?.deselect();
  }

  deselectAll(condition?: (option: ListOption<T>) => boolean): void {
    (condition ? this.options.filter(condition) : this.options).forEach((option: ListOption<T>) => option.deselect());
  }

  hasValue(): boolean {
    return this._model.hasValue();
  }

  isMultipleSelection(): boolean {
    return this._model.isMultipleSelection();
  }

  isSelected(value: T | undefined): boolean {
    return isNil(value) ? false : this._model.isSelected(value);
  }

  isSingleSelection(): boolean {
    return !this.isMultipleSelection();
  }

  registerOnChange(onChange: (value: T | T[] | undefined) => void): void {
    this._onChange = onChange;
  }

  registerOnTouched(): void {
    return;
  }

  /**
   * Selects the option the value is associated with.
   * Does not add the value to the internal {@link SelectionModel} unless an option with this value is present.
   *
   * @param value the option value
   */
  select(value: T | T[]): void {
    if (Array.isArray(value)) {
      value.forEach((value: T) => this._getOptionByValue(value)?.select());
    } else {
      this._getOptionByValue(value)?.select();
    }
  }

  selectAll(condition?: (option: ListOption<T>) => boolean): void {
    (condition ? this.options.filter(condition) : this.options).forEach((option: ListOption<T>) => option.select());
  }

  setDisabledState(isDisabled: boolean): void {
    for (const option of this.options) {
      option.disabled = isDisabled;
    }
  }

  writeValue(value: T | T[]): void {
    // Directly update the model if content is not ready yet
    // Will be synced eventually: _syncWithSelectionModel()
    if (!this._isContentReady) {
      if (Array.isArray(value)) {
        this._model.select(...value);
      } else {
        this._model.select(value);
      }

      return;
    }

    this._resetOptions();
    this.select(value);
  }

  private _alignOptionTypes(): void {
    for (const option of this.options) {
      option.type = `${this.type}-option` as ListOptionType;
    }
  }

  private _getOptionByValue(value: T): ListOption<T> | undefined {
    return this.options.find((option: ListOption<T>) => option.value === value);
  }

  private _getSelectedOptions(): ListOption<T>[] {
    return this.options.filter((option: ListOption<T>) => this.isSelected(option.value));
  }

  private _onChange: (value: T | T[] | undefined) => void = () => null;

  private _preselect(options: ListOption<T>[]): void {
    if (this._model.isEmpty()) {
      for (const option of options) {
        if (!isNil(option.value) && option.selected) {
          this._model.select(option.value);
        }
      }
    }
  }

  private _resetOptions(): void {
    this._getSelectedOptions().forEach((option: ListOption<T>) => option.deselect());
  }

  private _syncWithSelectionModel(options: ListOption<T>[]): void {
    for (const option of options) {
      if (this.isSelected(option.value) && !option.selected) {
        option.select();
      }

      if (!this.isSelected(option.value) && option.selected) {
        option.select();
      }
    }
  }
}
