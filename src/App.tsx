import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';
import { HomePage } from './pages/HomePage';
import { EditPage } from './pages/EditPage';
import { BackgroundWrapper } from './components/BackgroundWrapper';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BackgroundWrapper>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/edit" element={<EditPage />} />
          </Routes>
        </Router>
      </BackgroundWrapper>
    </ThemeProvider>
  );
}

export default App;
