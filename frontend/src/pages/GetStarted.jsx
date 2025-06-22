import { useState } from "react";
import { saveToken, getUserFromToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";

const GetStarted = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setMessage("");
    setFormData({ username: "", password: "" });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          role: isLogin ? undefined : "user"
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || data.error || "Something went wrong");
        return;
      }

      if (isLogin) {
        const userFromToken = getUserFromToken(data.token);
        if (userFromToken) {
          const userData = {
            username: userFromToken.username,
            role: userFromToken.role
          };
          saveToken(data.token, userData);
          setMessage(`Welcome back, ${userData.username}!`);
          
          setTimeout(() => {
            navigate("/");
          }, 1500);
        } else {
          setMessage("Login successful but failed to decode user data");
        }
      } else {
        setMessage("Registration successful! Please log in.");
        setTimeout(() => {
          setIsLogin(true);
          setMessage("");
          setFormData({ username: "", password: "" });
        }, 2000);
      }
    } catch (err) {
      console.error("Auth error:", err);
      setMessage("Failed to connect to server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-40 left-40 w-60 h-60 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 10}s`
            }}
          ></div>
        ))}
      </div>

      {/* Main container */}
      <div className="relative z-10 w-full max-w-md transform transition-all duration-500 hover:scale-105">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8 space-y-6">
          {/* Header with animated text */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
              {isLogin ? "Welcome Back" : "Join Us"}
            </h1>
            <p className="text-gray-300 text-sm">
              {isLogin ? "Sign in to your account" : "Create your account"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  required
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all duration-300 group-hover:border-white/30"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur"></div>
              </div>

              <div className="relative group">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  required
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all duration-300 group-hover:border-white/30"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur"></div>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative group overflow-hidden rounded-xl py-3 px-6 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <span className="relative z-10">
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  isLogin ? "Login" : "Sign Up"
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </button>
          </form>

          {/* Toggle mode button */}
          <div className="text-center">
            <button
              onClick={toggleMode}
              disabled={isLoading}
              className="text-gray-300 hover:text-white transition-colors duration-300 text-sm group disabled:opacity-50"
            >
              <span className="relative">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <span className="text-cyan-400 font-semibold group-hover:text-purple-400 transition-colors duration-300">
                  {isLogin ? "Sign up" : "Log in"}
                </span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 group-hover:w-full transition-all duration-300"></span>
              </span>
            </button>
          </div>

          {/* Message display */}
          {message && (
            <div className={`text-center p-3 rounded-xl border transition-all duration-500 transform ${
              message.includes('Welcome') || message.includes('successful')
                ? 'bg-green-500/20 border-green-400/50 text-green-300'
                : 'bg-red-500/20 border-red-400/50 text-red-300'
            }`}
            style={{
              animation: 'fadeIn 0.5s ease-out'
            }}>
              {message}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-10px) rotate(120deg); }
          66% { transform: translateY(5px) rotate(240deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default GetStarted;