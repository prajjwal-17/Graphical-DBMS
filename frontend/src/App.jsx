// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';

import Home from './pages/Home';
import Queries from './pages/Queries';
import GetStarted from './pages/GetStarted';
import AddData from './pages/AddData';
import CustomQueries from './pages/CustomQueries';

const App = () => {
  return (
    <Router>
      <Navbar />
      <div className="p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/queries" element={<Queries />} />
          <Route path="/get-started" element={<GetStarted />} />
          <Route path="/add-data" element={<AddData />} />
          <Route path="/custom-queries" element={<CustomQueries />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
