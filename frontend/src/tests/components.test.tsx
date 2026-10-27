import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MetricCard } from '../components/MetricCard';
import { AqiBadge } from '../components/AqiBadge';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Navbar } from '../components/Navbar';
import { Activity } from 'lucide-react';
import { api } from '../services/api';

describe('Frontend UI Components & States', () => {
  it('renders MetricCard with title, value, unit, and subtitle', () => {
    render(
      <MetricCard
        title="PM2.5 Daily Average"
        value={42.8}
        unit="µg/m³"
        subtitle="Across 8 Kerala CAAQMS stations"
        icon={Activity}
      />
    );

    expect(screen.getByText('PM2.5 Daily Average')).toBeDefined();
    expect(screen.getByText('42.8')).toBeDefined();
    expect(screen.getByText('µg/m³')).toBeDefined();
    expect(screen.getByText('Across 8 Kerala CAAQMS stations')).toBeDefined();
  });

  it('renders AqiBadge with official CPCB categories and colors', () => {
    const { rerender } = render(<AqiBadge value={45} category="Good" />);
    expect(screen.getByText(/45/)).toBeDefined();
    expect(screen.getByText(/Good/)).toBeDefined();

    rerender(<AqiBadge value={150} category="Moderate" />);
    expect(screen.getByText(/150/)).toBeDefined();
    expect(screen.getByText(/Moderate/)).toBeDefined();

    rerender(<AqiBadge value={420} category="Severe" />);
    expect(screen.getByText(/420/)).toBeDefined();
    expect(screen.getByText(/Severe/)).toBeDefined();
  });

  it('renders LoadingState with loading indicator and message', () => {
    render(<LoadingState message="Fetching CPCB station observations..." />);
    expect(screen.getByText('Fetching CPCB station observations...')).toBeDefined();
  });

  it('renders EmptyState with helpful explanation and retry action', () => {
    let clicked = false;
    render(
      <EmptyState
        title="No Observations Found"
        description="No valid environmental readings match the selected date range."
        actionText="Reset Filters"
        onReset={() => { clicked = true; }}
      />
    );

    expect(screen.getByText('No Observations Found')).toBeDefined();
    expect(screen.getByText('No valid environmental readings match the selected date range.')).toBeDefined();
    const btn = screen.getByText('Reset Filters');
    btn.click();
    expect(clicked).toBe(true);
  });

  it('renders ErrorState with message and retry capability', () => {
    let retried = false;
    render(
      <ErrorState
        title="Backend Communication Error"
        message="Unable to reach Rust Axum service."
        onRetry={() => { retried = true; }}
      />
    );

    expect(screen.getByText('Backend Communication Error')).toBeDefined();
    expect(screen.getByText('Unable to reach Rust Axum service.')).toBeDefined();
    const retryBtn = screen.getByText('Retry Request');
    retryBtn.click();
    expect(retried).toBe(true);
  });

  it('renders Navbar with all 7 primary navigation routes', async () => {
    vi.spyOn(api, 'getDataStatus').mockResolvedValue({
      status: 'operational',
      total_stations: 230,
      active_stations: 80,
      total_observations: 437226,
      total_aqi_records: 66771,
      pollutants: ['PM2.5', 'PM10'],
      dataset_start_date: '2015-01-01',
      dataset_end_date: '2020-07-01',
      last_ingestion_run: null,
    });

    await act(async () => {
      render(
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Navbar />
        </BrowserRouter>
      );
    });

    expect(screen.getByText('AirWatch')).toBeDefined();
    expect(screen.getByText('Overview')).toBeDefined();
    expect(screen.getByText('Explorer')).toBeDefined();
    expect(screen.getByText('Comparison')).toBeDefined();
    expect(screen.getByText('Standards (NAAQS)')).toBeDefined();
    expect(screen.getByText('Historical')).toBeDefined();
    expect(screen.getByText('Sources & Methods')).toBeDefined();
    expect(screen.getByText('Ingestion Health')).toBeDefined();
  });
});
