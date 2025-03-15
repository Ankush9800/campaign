import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm fixed w-full top-0 z-10">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="text-2xl font-bold text-blue-600">Taskwala</Link>
        <div className="flex space-x-4">
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