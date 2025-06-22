import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute'; // ✅ Import

import Home from './pages/Home';
import Queries from './pages/Queries';
import GetStarted from './pages/GetStarted';
import AddData from './pages/AddData';
import CustomQueries from './pages/CustomQueries';

const App = () => {
  return (
    <Router>
      <Navbar />
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/get-started" element={<GetStarted />} />

          {/* ✅ Protected Routes */}
          <Route
            path="/queries"
            element={
              <ProtectedRoute>
                <Queries />
              </ProtectedRoute>
            }
          />

          <Route
            path="/custom-queries"
            element={
              <ProtectedRoute>
                <CustomQueries />
              </ProtectedRoute>
            }
          />

          {/* ✅ Admin Only */}
          <Route
            path="/add-data"
            element={
              <ProtectedRoute adminOnly={true}>
                <AddData />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
