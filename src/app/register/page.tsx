import RegisterForm from './RegisterForm';

export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/20 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-md z-10">
        <div className="glass-panel p-8 rounded-2xl shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg shadow-primary/20">
              T
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Create an Account</h1>
            <p className="text-slate-400 text-sm">Join TimeTrack and start managing your hours.</p>
          </div>
          
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
