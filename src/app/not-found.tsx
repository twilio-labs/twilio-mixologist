function NotFoundPage() {
  return (
    <div className="w-full flex flex-col justify-center items-center flex-1">
      <h2 className="text-2xl">404</h2>
      <div className="display: inline-block;">
        <h3>
          This page could not be found or maybe you are missing the required
          privleges.
        </h3>
      </div>
    </div>
  );
}

export default NotFoundPage;
