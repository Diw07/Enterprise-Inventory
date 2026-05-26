import { SignIn } from '@clerk/clerk-react';
import { Package } from 'lucide-react';

export const LoginPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
            <Package size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-lg leading-none">EMS</h1>
            <p className="text-xs text-gray-500">Enterprise Inventory Management</p>
          </div>
        </div>

        {/* Clerk Sign In */}
        <div className="flex justify-center">
          <SignIn
            routing="hash"
            afterSignInUrl="/"
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'shadow-xl rounded-2xl',
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};
