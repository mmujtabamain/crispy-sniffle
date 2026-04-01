function TopBar() {
  return (
    <header className="flex items-center justify-between bg-gray-800 text-white p-4">
      <h1 className="text-xl font-bold">Crispy Sniffle</h1>
      <nav>
        <ul className="flex space-x-4">
          <li><a href="#" className="hover:underline">Home</a></li>
          <li><a href="#" className="hover:underline">About</a></li>
          <li><a href="#" className="hover:underline">Contact</a></li>
        </ul>
      </nav>
    </header>
  );
}

export default TopBar;