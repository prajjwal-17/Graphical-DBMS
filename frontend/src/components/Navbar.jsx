import { NavLink, Link, useNavigate } from 'react-router-dom';
import { isLoggedIn, isAdmin, logout, getUser } from '../utils/auth';
import { useState } from 'react';

const Navbar = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/get-started');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white shadow-xl border-b border-gray-700 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent hover:from-blue-300 hover:to-purple-400 transition-all duration-300"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">G</span>
            </div>
            <span>GraphDB Explorer</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex items-center space-x-6">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `relative px-3 py-2 rounded-lg transition-all duration-300 ${
                    isActive 
                      ? 'text-blue-400 bg-blue-500/10 shadow-lg shadow-blue-500/20' 
                      : 'hover:text-blue-300 hover:bg-gray-700/50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    Home
                    {isActive && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full"></div>
                    )}
                  </>
                )}
              </NavLink>

              {isLoggedIn() && (
                <>
                  <NavLink
                    to="/queries"
                    className={({ isActive }) =>
                      `relative px-3 py-2 rounded-lg transition-all duration-300 ${
                        isActive 
                          ? 'text-blue-400 bg-blue-500/10 shadow-lg shadow-blue-500/20' 
                          : 'hover:text-blue-300 hover:bg-gray-700/50'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        Queries
                        {isActive && (
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full"></div>
                        )}
                      </>
                    )}
                  </NavLink>

                  <NavLink
                    to="/custom-queries"
                    className={({ isActive }) =>
                      `relative px-3 py-2 rounded-lg transition-all duration-300 ${
                        isActive 
                          ? 'text-blue-400 bg-blue-500/10 shadow-lg shadow-blue-500/20' 
                          : 'hover:text-blue-300 hover:bg-gray-700/50'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        Custom Queries
                        {isActive && (
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full"></div>
                        )}
                      </>
                    )}
                  </NavLink>

                  {isAdmin() && (
                    <NavLink
                      to="/add-data"
                      className={({ isActive }) =>
                        `relative px-3 py-2 rounded-lg transition-all duration-300 ${
                          isActive 
                            ? 'text-purple-400 bg-purple-500/10 shadow-lg shadow-purple-500/20' 
                            : 'hover:text-purple-300 hover:bg-gray-700/50'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span className="flex items-center space-x-1">
                            <span>⚡</span>
                            <span>Add Data</span>
                          </span>
                          {isActive && (
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-purple-400 rounded-full"></div>
                          )}
                        </>
                      )}
                    </NavLink>
                  )}
                </>
              )}
            </div>

            {/* User Section */}
            <div className="flex items-center space-x-4 pl-6 border-l border-gray-600">
              {!isLoggedIn() ? (
                <NavLink 
                  to="/get-started" 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-6 py-2 rounded-full font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Get Started
                </NavLink>
              ) : (
                <>
                  <div className="flex items-center space-x-3 bg-gray-700/50 px-4 py-2 rounded-full border border-gray-600">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {user?.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{user?.username}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        user?.role === 'admin' 
                          ? 'bg-purple-500/20 text-purple-300' 
                          : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {user?.role}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors duration-200"
            >
              <div className="w-6 h-6 flex flex-col justify-center items-center">
                <span className={`bg-white block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${isMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-0.5'}`}></span>
                <span className={`bg-white block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm my-0.5 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                <span className={`bg-white block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${isMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-0.5'}`}></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-700 py-4 animate-fade-in">
            <div className="flex flex-col space-y-2">
              <NavLink
                to="/"
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `px-4 py-3 rounded-lg transition-all duration-300 ${
                    isActive 
                      ? 'text-blue-400 bg-blue-500/10' 
                      : 'hover:text-blue-300 hover:bg-gray-700/50'
                  }`
                }
              >
                Home
              </NavLink>

              {isLoggedIn() && (
                <>
                  <NavLink
                    to="/queries"
                    onClick={() => setIsMenuOpen(false)}
                    className={({ isActive }) =>
                      `px-4 py-3 rounded-lg transition-all duration-300 ${
                        isActive 
                          ? 'text-blue-400 bg-blue-500/10' 
                          : 'hover:text-blue-300 hover:bg-gray-700/50'
                      }`
                    }
                  >
                    Queries
                  </NavLink>

                  <NavLink
                    to="/custom-queries"
                    onClick={() => setIsMenuOpen(false)}
                    className={({ isActive }) =>
                      `px-4 py-3 rounded-lg transition-all duration-300 ${
                        isActive 
                          ? 'text-blue-400 bg-blue-500/10' 
                          : 'hover:text-blue-300 hover:bg-gray-700/50'
                      }`
                    }
                  >
                    Custom Queries
                  </NavLink>

                  {isAdmin() && (
                    <NavLink
                      to="/add-data"
                      onClick={() => setIsMenuOpen(false)}
                      className={({ isActive }) =>
                        `px-4 py-3 rounded-lg transition-all duration-300 ${
                          isActive 
                            ? 'text-purple-400 bg-purple-500/10' 
                            : 'hover:text-purple-300 hover:bg-gray-700/50'
                        }`
                      }
                    >
                      ⚡ Add Data
                    </NavLink>
                  )}
                </>
              )}

              <div className="border-t border-gray-700 pt-4 mt-4">
                {!isLoggedIn() ? (
                  <NavLink 
                    to="/get-started"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-4 py-3 rounded-lg font-medium text-center transition-all duration-300"
                  >
                    Get Started
                  </NavLink>
                ) : (
                  <>
                    <div className="flex items-center space-x-3 px-4 py-3 bg-gray-700/50 rounded-lg mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                          {user?.username?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{user?.username}</div>
                        <div className={`text-sm px-2 py-1 rounded-full inline-block ${
                          user?.role === 'admin' 
                            ? 'bg-purple-500/20 text-purple-300' 
                            : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          {user?.role}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 px-4 py-3 rounded-lg font-medium transition-all duration-300"
                    >
                      Logout
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;