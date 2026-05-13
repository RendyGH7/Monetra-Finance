import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from '@/pages/Login'

test('renders login heading', () => {
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  )

  expect(screen.getByText('Monetra')).toBeInTheDocument()
})
