import { render } from '@testing-library/react';

// Test básico para verificar que Jest funciona
describe('Jest Setup', () => {
  it('should work correctly', () => {
    expect(1 + 1).toBe(2);
  });

  it('should render a simple div', () => {
    const { container } = render(<div>Hello World</div>);
    expect(container.textContent).toContain('Hello World');
  });
});
