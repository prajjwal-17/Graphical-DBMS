// src/components/Navbar.jsx
import { NavLink, Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-gray-800 text-white px-6 py-4 shadow-md flex justify-between items-center">
      <Link to="/" className="text-2xl font-bold text-blue-400">GraphDB Explorer</Link>
      <div className="flex gap-6">
        <NavLink to="/" className={({ isActive }) => isActive ? 'text-blue-400 border-b-2 border-blue-400 pb-1' : 'hover:text-blue-300'}>
          Home
        </NavLink>
        <NavLink to="/queries" className={({ isActive }) => isActive ? 'text-blue-400 border-b-2 border-blue-400 pb-1' : 'hover:text-blue-300'}>
          Queries
        </NavLink>
        <NavLink to="/get-started" className={({ isActive }) => isActive ? 'text-blue-400 border-b-2 border-blue-400 pb-1' : 'hover:text-blue-300'}>
          Get Started
        </NavLink>
        <NavLink to="/add-data" className={({ isActive }) => isActive ? 'text-blue-400 border-b-2 border-blue-400 pb-1' : 'hover:text-blue-300'}>
          Add Data
        </NavLink>
        <NavLink to="/custom-queries" className={({ isActive }) => isActive ? 'text-blue-400 border-b-2 border-blue-400 pb-1' : 'hover:text-blue-300'}>
          Custom Queries
        </NavLink>
      </div>
    </nav>
  );
};

export default Navbar;
