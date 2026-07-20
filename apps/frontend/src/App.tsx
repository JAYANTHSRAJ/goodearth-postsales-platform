import { FC } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { QueryProvider } from './app/QueryProvider';
import { ThemeProvider } from './app/ThemeProvider';
import { router } from './routes';

export const App: FC = () => {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
};

export default App;
