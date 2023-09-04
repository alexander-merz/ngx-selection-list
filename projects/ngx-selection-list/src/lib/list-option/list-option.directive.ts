import { coerceBooleanProperty, coerceNumberProperty } from '@angular/cdk/coercion';
import { ChangeDetectorRef, Directive, ElementRef, EventEmitter, HostBinding, HostListener, Input, Output } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ListOption, OptionState } from './list-option';

export type ListOptionType = 'listbox-option' | 'grid-option';

const DEFAULT_SELECTION_TIMEOUT: number = 200;

/**
 * Apply option behaviour to any {@link HTMLElement}.
 *
 * An option is {@link https://dictionary.cambridge.org/dictionary/english/option "one thing that can be chosen from a set of possibilities"}.
 *
 * They are mainly used within a surrounding {@link SelectComponent}.
 *
 * With it comes a {@link selected} and a {@link value} property to reflect the option state.
 *
 * If no value is provided it will fall back to the element's textContent.
 *
 * The selected state is inverted upon click, enter or space.
 *
 * @implements {Option}
 * @example
 * <span listOption [value]="1">Option 1</span>
 * @author Alexander Merz
 */
@Directive({
  standalone: true,
  selector: '[ngxListOption]',
  host: {
    tabindex: '0',
    role: 'option',
    '[class.selectionTimeout]': 'selectionTimeout > 0',
    '[style.cursor]': 'disabled ? "not-allowed" : "pointer"',
    '[style.pointer-events]': 'disabled ? "none" : "auto"',
  },
})
export class ListOptionDirective<T = unknown> implements ListOption<T> {
  @Input({ required: true })
  value: T = {} as T;

  @Input({ transform: coerceBooleanProperty })
  @HostBinding('attr.disabled')
  @HostBinding('attr.aria-disabled')
  disabled: boolean = false;

  @Input({ transform: coerceBooleanProperty })
  @HostBinding('attr.selected')
  selected: boolean = false;

  @HostBinding('attr.aria-selected')
  protected get ariaSelected(): boolean {
    return this.selected;
  }

  /**
   * Define a custom timespan (in ms) after which the option goes into deselected state again.
   * If used without a value assignment it will fall back to the default selection timeout.
   */
  @Input()
  set selectionTimeout(timeout: number | string | undefined) {
    if (timeout == null || timeout === '') {
      this._selectionTimeout = DEFAULT_SELECTION_TIMEOUT;
    } else {
      this._selectionTimeout = coerceNumberProperty(timeout);
    }
  }

  get selectionTimeout(): number | undefined {
    return this._selectionTimeout;
  }

  /** The {@link ListOptionType option type} reflects the context the option is used in. */
  @Input()
  @HostBinding('attr.type')
  type: ListOptionType = 'listbox-option';

  /** Emits the selected state upon selection change. */
  @Output()
  readonly selectedChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  /** Emits the selected state and the option value upon selection change. */
  readonly state$: Observable<OptionState<T>> = this.selectedChange.pipe(map((selected: boolean) => ({ selected, value: this.value })));

  private _selectionTimeout?: number;

  constructor(
    protected readonly _elementRef: ElementRef,
    protected readonly _changeDetectionRef: ChangeDetectorRef,
  ) {}

  @HostListener('click', ['$event'])
  @HostListener('keydown.enter', ['$event'])
  @HostListener('keydown.space', ['$event'])
  protected _onUserInteraction(event: Event): void {
    if (event instanceof KeyboardEvent && event.code === 'Space') {
      event.preventDefault();
    }

    this._toggleSelected();
  }

  select(): void {
    this._update(true);
  }

  deselect(): void {
    this._update(false);
  }

  private _toggleSelected(): void {
    this._update(!this.selected);
  }

  private _update(selected: boolean): void {
    this.selected = selected;

    if (this.selectionTimeout && selected) {
      setTimeout(() => this.deselect(), this.selectionTimeout);
    }

    // Don't emit deselection when a selectionTimeout is provided
    if (!this.selectionTimeout || (this.selectionTimeout && selected)) {
      this.selectedChange.emit(selected);
    }

    this._changeDetectionRef.markForCheck();
  }
}
