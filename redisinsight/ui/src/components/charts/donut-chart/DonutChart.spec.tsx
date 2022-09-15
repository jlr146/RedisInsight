import React from 'react'
import { render, screen, fireEvent } from 'uiSrc/utils/test-utils'

import DonutChart, { ChartData } from './DonutChart'

const mockData: ChartData[] = [
  { value: 1, name: 'A', color: [0, 0, 0] },
  { value: 5, name: 'B', color: [10, 10, 10] },
  { value: 10, name: 'C', color: [20, 20, 20] },
  { value: 2, name: 'D', color: [30, 30, 30] },
  { value: 30, name: 'E', color: [40, 40, 40] },
  { value: 15, name: 'F', color: [50, 50, 50] },
]

describe('DonutChart', () => {
  it('should render with empty data', () => {
    expect(render(<DonutChart data={[]} />)).toBeTruthy()
  })

  it('should render with data', () => {
    expect(render(<DonutChart data={mockData} />)).toBeTruthy()
  })

  it('should render svg', () => {
    render(<DonutChart data={mockData} name="test" />)
    expect(screen.getByTestId('donut-test')).toBeInTheDocument()
  })

  it('should render arcs and labels', () => {
    render(<DonutChart data={mockData} />)
    mockData.forEach(({ value, name }) => {
      expect(screen.getByTestId(`arc-${name}-${value}`)).toBeInTheDocument()
      expect(screen.getByTestId(`label-${name}-${value}`)).toBeInTheDocument()
    })
  })

  it('should do not render label value if value less than 5%', () => {
    render(<DonutChart data={mockData} config={{ percentToShowLabel: 5 }} />)
    expect(screen.getByTestId('label-A-1')).toHaveTextContent('')
  })

  it('should render label value if value more than 5%', () => {
    render(<DonutChart data={mockData} config={{ percentToShowLabel: 5 }} />)
    expect(screen.getByTestId('label-E-30')).toHaveTextContent('E: 30')
  })

  it('should call render tooltip and label methods', () => {
    const renderLabel = jest.fn()
    const renderTooltip = jest.fn()
    render(<DonutChart data={mockData} renderLabel={renderLabel} renderTooltip={renderTooltip} />)
    expect(renderLabel).toBeCalled()

    fireEvent.mouseEnter(screen.getByTestId('arc-A-1'))
    expect(renderTooltip).toBeCalled()
  })

  it('should set tooltip as visible on hover and hidden on leave', () => {
    render(<DonutChart data={mockData} />)

    fireEvent.mouseEnter(screen.getByTestId('arc-A-1'))
    expect(screen.getByTestId('chart-value-tooltip')).toBeVisible()

    fireEvent.mouseLeave(screen.getByTestId('arc-A-1'))
    expect(screen.getByTestId('chart-value-tooltip')).not.toBeVisible()
  })
})
