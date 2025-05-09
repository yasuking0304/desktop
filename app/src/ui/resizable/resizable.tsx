import * as React from 'react'
import { clamp } from '../../lib/clamp'
import { AriaLiveContainer } from '../accessibility/aria-live-container'

export const DefaultMaxWidth = 350
export const DefaultMinWidth = 200

/** This class is assigned to the containing div of the element and used in
 * determining whether the resizable is focused. */
export const resizableComponentClass = 'resizable-component'

export enum ResizeDirection {
  Increase = 'Increase',
  Decrease = 'Decrease',
}

export interface IResizableState {
  /** The message that is announced to screen reader users to inform them of
   * resizable panel state */
  readonly resizeMessage: string
}

/**
 * Component abstracting a resizable panel.
 *
 * Note: this component is pure, consumers must subscribe to the
 * onResize and onReset event and update the width prop accordingly.
 */
export class Resizable extends React.Component<
  IResizableProps,
  IResizableState
> {
  private resizeContainer: HTMLDivElement | null = null
  private startWidth: number | null = null
  private startX: number | null = null

  public constructor(props: IResizableProps) {
    super(props)
    this.state = { resizeMessage: '' }
  }

  /**
   * Returns the current width as determined by props.
   *
   * This value will be constrained by the maximum and minimum
   * with props and might not be identical to that of props.width.
   */
  private getCurrentWidth() {
    return this.clampWidth(this.props.width)
  }

  /**
   * Constrains the provided width to lie within the minimum and
   * maximum widths as determined by props
   */
  private clampWidth(width: number) {
    const { minimumWidth: min, maximumWidth: max } = this.props
    return clamp(width, min ?? DefaultMinWidth, max ?? DefaultMaxWidth)
  }

  /**
   * Handler for when the user presses the mouse button over the resize
   * handle.
   */
  private handleDragStart = (e: React.MouseEvent<any>) => {
    this.startX = e.clientX
    this.startWidth = this.getCurrentWidth()

    document.addEventListener('mousemove', this.handleDragMove)
    document.addEventListener('mouseup', this.handleDragStop)

    e.preventDefault()
  }

  /**
   * Handler for when the user moves the mouse while dragging
   */
  private handleDragMove = (e: MouseEvent) => {
    if (this.startWidth === null || this.startX === null) {
      return
    }

    const deltaX = e.clientX - this.startX
    const newWidth = this.startWidth + deltaX

    this.updateResizeMessage(
      deltaX > 0 ? ResizeDirection.Increase : ResizeDirection.Decrease
    )
    this.props.onResize(this.clampWidth(newWidth))
    e.preventDefault()
  }

  private unsubscribeFromGlobalEvents() {
    document.removeEventListener('mousemove', this.handleDragMove)
    document.removeEventListener('mouseup', this.handleDragStop)
  }

  /**
   * Handler for when the user lets go of the mouse button during
   * a resize operation.
   */
  private handleDragStop = (e: MouseEvent) => {
    this.unsubscribeFromGlobalEvents()
    e.preventDefault()
  }

  /**
   * Handler for when a user uses keyboard shortcuts to increase the size the
   * active resizable
   */
  private handleMenuResizeEventIncrease = (
    ev?: Event | React.SyntheticEvent<unknown>
  ) => {
    this.handleMenuResizeEvent(ResizeDirection.Increase)
    ev?.preventDefault()
  }

  /**
   * Handler for when a user uses keyboard shortcuts to decrease the size the
   * active resizable
   */
  private handleMenuResizeEventDecrease = (
    ev?: Event | React.SyntheticEvent<unknown>
  ) => {
    this.handleMenuResizeEvent(ResizeDirection.Decrease)
    ev?.preventDefault()
  }

  /**
   * Handler for when a user uses keyboard shortcuts to resize the size the
   * active resizable
   */
  private handleMenuResizeEvent(resizeDirection: ResizeDirection) {
    const { width } = this.props
    const changedWidth =
      resizeDirection === ResizeDirection.Decrease ? width - 5 : width + 5

    const newWidth = this.clampWidth(changedWidth)

    this.updateResizeMessage(resizeDirection)
    this.props.onResize(this.clampWidth(newWidth))
  }

  /**
   * Adds and removes listeners for custom events fired when user users keyboard
   * to resize the active resizable
   */
  private onResizableRef = (ref: HTMLDivElement | null) => {
    if (ref === null) {
      this.resizeContainer?.removeEventListener(
        'increase-active-resizable-width',
        this.handleMenuResizeEventIncrease
      )
      this.resizeContainer?.removeEventListener(
        'decrease-active-resizable-width',
        this.handleMenuResizeEventDecrease
      )
    } else {
      ref.addEventListener(
        'increase-active-resizable-width',
        this.handleMenuResizeEventIncrease
      )
      ref.addEventListener(
        'decrease-active-resizable-width',
        this.handleMenuResizeEventDecrease
      )
    }
    this.resizeContainer = ref
  }

  private getResizePercentage() {
    const minWidth = this.props.minimumWidth ?? 0
    const maxWidth = this.props.maximumWidth ?? DefaultMaxWidth
    return Math.round(
      ((this.getCurrentWidth() - minWidth) / (maxWidth - minWidth)) * 100
    )
  }

  private updateResizeMessage(direction: ResizeDirection) {
    const directionMessage =
      direction === ResizeDirection.Increase ? 'increased' : 'decreased'
    this.setState({
      resizeMessage: `${
        this.props.description
      } width ${directionMessage}. Set to ${this.getResizePercentage()}%`,
    })
  }

  public render() {
    const style: React.CSSProperties = {
      width: this.getCurrentWidth(),
      maxWidth: this.props.maximumWidth,
      minWidth: this.props.minimumWidth,
    }

    return (
      <div
        id={this.props.id}
        className={resizableComponentClass}
        style={style}
        ref={this.onResizableRef}
      >
        {this.props.children}
        <button
          // Prevent form submission with this button
          type="button"
          tabIndex={-1}
          onMouseDown={this.handleDragStart}
          onDoubleClick={this.props.onReset}
          className="resize-handle"
          aria-label="Resize handle"
        />
        <AriaLiveContainer
          message={this.state.resizeMessage}
          trackedUserInput={this.state.resizeMessage}
        />
      </div>
    )
  }
}

export interface IResizableProps {
  readonly width: number

  /** The maximum width the panel can be resized to.
   *
   * @default 350
   */
  readonly maximumWidth?: number

  /**
   * The minimum width the panel can be resized to.
   *
   * @default 150
   */
  readonly minimumWidth?: number

  /** The optional ID for the root element. */
  readonly id?: string

  /** Used to describe which resizable was updated to screen reader users */
  readonly description: string

  /**
   * Handler called when the width of the component has changed
   * through an explicit resize event (dragging the handle).
   */
  readonly onResize: (newWidth: number) => void

  /**
   * Handler called when the resizable component has been
   * reset (ie restored to its original width by double clicking
   * on the resize handle).
   */
  readonly onReset: () => void
}
