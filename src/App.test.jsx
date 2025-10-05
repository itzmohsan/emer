import React from 'react'
import { render, screen } from '@testing-library/react'
import App from './App'

test('renders emergency app', () => {
  render(<App />)
  const linkElement = screen.getByText(/Emergency Quick Actions/i)
  expect(linkElement).toBeInTheDocument()
})