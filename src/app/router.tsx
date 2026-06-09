import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import TodayPage from '../pages/Today';
import StatisticsPage from '../pages/Statistics';
import ArchivePage from '../pages/Archive';
import SettingsPage from '../pages/Settings';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <TodayPage /> },
      { path: 'statistics', element: <StatisticsPage /> },
      { path: 'statistics/archive', element: <ArchivePage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);
