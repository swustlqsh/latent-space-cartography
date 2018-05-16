import * as d3 from 'd3'
import _ from 'lodash'
import {store} from '../../controllers/config'
import {moveToFront} from './util'

/**
 * @fileOverview
 * Drawing and interaction of the scatter plot dots (and their labels).
 */
class Dots {
  /**
   * Constructor
   * @param scales
   * @param parent
   * @param radius
   * @param mark_type
   * @param color
   */
  constructor (scales, parent, radius, color, mark_type) {
    /**
     * Styling
     */
    this.radius = radius
    this.color = color
    this.mark_type = mark_type

    /**
     * Communicate with parent
     */
    this._parent = parent
    this._scales = scales
  }

  /**
   * Draw the dots and define interaction.
   * @param data
   * @param emitter
   * @param dispatch
   */
  draw (data, emitter, dispatch) {
    let scales = this._scales
    let parent = this._parent
    let that = this

    if (this.mark_type === 1) {
      let dots = parent.selectAll(".dot")
        .data(data)
        .enter()
        .append("circle")
        .classed("dot", true)
        .attr('r', () => this.radius)
        .attr('cx', (d) => scales.x(d.x))
        .attr('cy', (d) => scales.y(d.y))
        .style("fill", (d) => this._colorDot(d, scales.palette))
        .on('click', dotClick)

      dots.on('mouseover', dotMouseover)
        .on('mouseout', dotMouseout)
    } else if (this.mark_type === 2) {
      let img_size = 20

      // draw logos directly
      parent.selectAll(".mark-img")
        .data(data)
        .enter()
        .append("image")
        .classed("mark-img", true)
        .attr('x', (d) => scales.x(d.x) - img_size * 0.5)
        .attr('y', (d) => scales.y(d.y) - img_size * 0.5)
        .attr('width', () => img_size)
        .attr('height', () => img_size)
        .attr('xlink:href', (d) => store.getImageUrl(d.i))
        .on('click', dotClick)
    }

    function dotMouseover(d) {
      that._focusDot(d, d3.select(this), true)
      emitter.onDotHovered(d, scales.x(d.x), scales.y(d. y))
    }

    function dotMouseout () {
      that._unfocusDot()
      emitter.onDotHovered(null)
    }

    function dotClick (d) {
      emitter.onDotClicked(d)
    }

    this._registerCallbacks(dispatch)
  }

  /**
   * Register callbacks to the shared dispatcher, so dots can respond to outside events.
   * @param dispatch
   * @private
   */
  _registerCallbacks (dispatch) {
    dispatch.on('dot-focus-one', (p) => {
      if (!p) {
        this._unfocusDot()
      } else {
        this._focusDot(p, d3.selectAll('.dot').filter((d) => d.i === p.i))
      }
    })

    dispatch.on('dot-focus-set', (points) => {
      if (points) {
        this._focusSet(points)
      } else {
        this._unfocusSet()
      }
    })
  }

  /**
   * Focus one dot.
   * @param d
   * @param dot
   * @param hideText
   * @private
   */
  _focusDot (d, dot, hideText) {
    dot.attr('r', () => this.radius * 2)
      .classed('focused', true)
    moveToFront(dot)

    if (!hideText) {
      let t = null
      d3.selectAll('text')
        .each(function () {
          // really ugly hack because text has no binding data
          if (d3.select(this).text() === d.name) {
            t = d3.select(this)
          }
        })
      if (!t) {
        this._parent.append('text')
          .attr('x', () => Math.max(this._scales.x(d.x) - 30, 15))
          .attr('y', () => Math.max(this._scales.y(d.y) - 15, 15))
          .classed('focus-label', true)
          .text(() => d.name)
      } else {
        t.classed('focus-label', true)
      }
    }
  }

  /**
   * Remove the focus on one dot.
   * @private
   */
  _unfocusDot () {
    d3.selectAll('.dot.focused').attr('r', this.radius)
    d3.selectAll('.focus-label:not(.focused-set)').remove()
    d3.selectAll('.focus-label').classed('focus-label', false)
  }

  /**
   * Focus a set of dots.
   * @param pts
   * @private
   */
  _focusSet (pts) {
    let indices = {}
    _.each(pts, (pt) => indices[pt.i] = true)

    let grapes = d3.selectAll('.dot')
      .filter((d) => indices[d.i])
      .classed('focused-set', true)
    moveToFront(grapes)

    d3.selectAll('.dot')
      .filter((d) => !indices[d.i])
      .style('fill', (d) => '#ccc')
  }

  /**
   * Remove the focus on a set of dots.
   * @private
   */
  _unfocusSet () {
    d3.selectAll('.dot')
      .style("fill", (d) => this._colorDot(d, this._scales.palette))
    d3.selectAll('.dot.focused-set').attr('r', this.radius)
  }

  /**
   * Given a D3 datum, color it according to the current color attribute.
   * @param d
   * @param palette
   * @returns {*}
   * @private
   */
  _colorDot (d, palette) {
    let c = this.color

    if (c === 'mean_color') {
      return d['mean_color']
    } else if (c === 'industry' || c === 'source') {
      return palette(d[c])
    }

    return '#9467bd'
  }
}

export default Dots