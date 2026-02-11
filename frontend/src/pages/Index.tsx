
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-100 animate-fade-in">
      <div className="text-center space-y-8 animate-slide-up">
        <div className="space-y-6">
          <div className="animate-bounce-in">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-sky-600 to-blue-700 bg-clip-text text-transparent">
              Smart Meeting Hub
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-sky-400 to-blue-500 mx-auto mt-4 rounded-full"></div>
          </div>
          <p className="text-xl text-slate-600 max-w-md mx-auto leading-relaxed">
            Streamline your meetings with intelligent scheduling and room management
          </p>
        </div>
        
        <div className="flex gap-6 justify-center">
          <Link 
            to="/login" 
            className="group bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-sky-200 transform hover:-translate-y-1"
          >
            <span className="flex items-center gap-2">
              Sign In
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
          <Link 
            to="/register" 
            className="group bg-white hover:bg-sky-50 text-sky-600 px-8 py-4 rounded-xl font-semibold border-2 border-sky-200 hover:border-sky-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <span className="flex items-center gap-2">
              Get Started
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
