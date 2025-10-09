// src/components/Button.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button Component', () => {
  test('renders button with children', () => {
    render(<Button onClick={() => {}}>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  test('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByTestId('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('applies correct classes for primary variant', () => {
    render(<Button onClick={() => {}}>Primary</Button>);
    const button = screen.getByTestId('button');
    expect(button).toHaveClass('bg-blue-500');
  });

  test('applies correct classes for secondary variant', () => {
    render(<Button onClick={() => {}} variant="secondary">Secondary</Button>);
    const button = screen.getByTestId('button');
    expect(button).toHaveClass('bg-gray-200');
  });
});