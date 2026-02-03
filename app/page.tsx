import Search from '@/app/components/Search';
import ShowAnalytics from '@/app/components/ShowAnalytics';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Search/>
      <ShowAnalytics/>
    </main>
  );
}
