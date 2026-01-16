import { registerRootComponent } from 'expo';
import App from './App';
import { AppStateProvider } from './src/store/AppState';

function Root() {
  return (
    <AppStateProvider>
      <App />
    </AppStateProvider>
  );
}

registerRootComponent(Root);
