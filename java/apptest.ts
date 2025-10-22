// App.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

// Mock products globally (doesn't change)
vi.mock('@products/pages/products/products', () => ({
  products: () => <div data-testid="my-products">My products Content</div>,
}));

// Helper to render App with dynamic mock
const renderWithMock = async (mockReturnValue: any) => {
  vi.resetModules(); // Clear cache

  // Mock the service module
  vi.doMock('@services/user', async (importOriginal) => {
    const actual = await importOriginal();
    return {
      ...actual,
      useGetUserQuery: () => mockReturnValue,
    };
  });

  // Dynamically import App after mock
  const { default: App } = await import('./App');

  // Render with Provider (since you're using Redux)
  const store = configureStore({
    reducer: {
      [appSlice.reducerPath]: appSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(appSlice.middleware),
  });

  render(
    <Provider store={store}>
      <App />
    </Provider>
  );
};

describe('App component when user data is not loaded', () => {
  it('renders "User not loaded" when error is present', async () => {
    await renderWithMock({
       null,
      isLoading: false,
      error: { message: 'Failed to load user' }, // ✅ Error as object
    });

    expect(screen.getByText('User not loaded')).toBeInTheDocument();
  });

  it('renders "User not loaded" when no data and no error', async () => {
    await renderWithMock({
       null,
      isLoading: false,
      error: null,
    });

    expect(screen.getByText('User not loaded')).toBeInTheDocument();
  });
});

describe('App component when user is loaded', () => {
  it('renders products when user data is available', async () => {
    await renderWithMock({
       { id: 'abc' },
      isLoading: false,
      error: null,
    });

    await waitFor(() => {
      expect(screen.getByTestId('my-products')).toBeInTheDocument();
    });
  });
});