/**
 * Full-screen error state for users attempting to access routes
 * outside their assigned permission scope.
 */
const Unauthorized = () => {
  return (
    <div className="h-screen flex items-center justify-center">
      <h1 className="text-2xl font-bold text-red-600">
        ❌ Unauthorized Access
      </h1>
    </div>
  );
};

export default Unauthorized;
