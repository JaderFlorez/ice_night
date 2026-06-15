import { render, screen } from '@testing-library/react';
import App from '../App';
import { describe, it, expect, vi } from 'vitest';

// Mock supabase client to avoid real API calls in tests
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

describe('App', () => {
  it('renders login page by default', async () => {
    render(<App />);
    // Use findByText to wait for loading state to resolve and login page to render
    expect(await screen.findByText('ICE NIGHT ERP')).toBeInTheDocument();
  });
});
