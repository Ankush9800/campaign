import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm fixed w-full top-0 z-10">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="text-2xl font-bold text-blue-600">Taskwala</Link>
        <div className="flex space-x-4">
          <Link 
            to="/refer" 
            className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
            Refer & Earn
          </Link>
          <Link 
            to="/contact" 
            className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </nav>
  );
}