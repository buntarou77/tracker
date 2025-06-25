import RegisterForm from './components/SendForm';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="header bg-dark m-auto flex justify-center py-8">
        <RegisterForm />
      </div>
    </div>
  );
}