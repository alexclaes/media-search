'use client';

export default function ShowAnalytics() {
  async function handleClick() {
    const response = await fetch('/api/analytics');
    const data = await response.json();
    alert(JSON.stringify(data, null, 2));
  }

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-4 right-4 px-4 py-2"
    >
      Show Analytics
    </button>
  );
}
